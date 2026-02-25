#!/usr/bin/env python3
"""
移动端视频下载 Web 应用
支持 YouTube 及 yt-dlp 兼容的视频网站
依赖: pip install flask yt-dlp
"""

import os
import sys
import uuid
import json
import time
import threading
import subprocess
from pathlib import Path
from flask import Flask, render_template, request, jsonify, Response, send_file

# 自动安装依赖
def ensure_deps():
    try:
        import yt_dlp
    except ImportError:
        print("正在安装 yt-dlp ...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "yt-dlp"])
    try:
        import flask
    except ImportError:
        print("正在安装 flask ...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "flask"])

ensure_deps()

import yt_dlp

app = Flask(__name__)

DOWNLOAD_DIR = Path("downloads")
DOWNLOAD_DIR.mkdir(exist_ok=True)

# 任务状态存储 { job_id: { status, progress, speed, eta, filename, error } }
jobs: dict = {}
jobs_lock = threading.Lock()


# ──────────────────────────────────────────────
# 工具函数
# ──────────────────────────────────────────────

def make_job(job_id: str):
    with jobs_lock:
        jobs[job_id] = {
            "status": "pending",   # pending | downloading | merging | done | error
            "progress": 0,
            "speed": "",
            "eta": "",
            "title": "",
            "filename": None,
            "filepath": None,
            "error": None,
        }


def update_job(job_id: str, **kwargs):
    with jobs_lock:
        if job_id in jobs:
            jobs[job_id].update(kwargs)


def get_job(job_id: str) -> dict:
    with jobs_lock:
        return dict(jobs.get(job_id, {}))


def clean_old_jobs():
    """删除超过 1 小时的已完成任务及其文件"""
    cutoff = time.time() - 3600
    with jobs_lock:
        to_delete = []
        for jid, info in jobs.items():
            if info.get("status") in ("done", "error"):
                fp = info.get("filepath")
                if fp and Path(fp).exists():
                    try:
                        if Path(fp).stat().st_mtime < cutoff:
                            Path(fp).unlink(missing_ok=True)
                            to_delete.append(jid)
                    except Exception:
                        pass
        for jid in to_delete:
            del jobs[jid]


# ──────────────────────────────────────────────
# 下载核心
# ──────────────────────────────────────────────

FORMAT_MAP = {
    "best":  "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best[ext=mp4]/best",
    "1080p": "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best[height<=1080]",
    "720p":  "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]",
    "480p":  "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best[height<=480]",
    "audio": "bestaudio/best",
}


def run_download(job_id: str, url: str, quality: str):
    job_dir = DOWNLOAD_DIR / job_id
    job_dir.mkdir(exist_ok=True)

    fmt = FORMAT_MAP.get(quality, FORMAT_MAP["best"])
    is_audio = quality == "audio"

    downloaded_path: list = []

    def progress_hook(d):
        if d["status"] == "downloading":
            pct_str = d.get("_percent_str", "0%").strip().replace("%", "")
            try:
                pct = float(pct_str)
            except ValueError:
                pct = 0
            update_job(
                job_id,
                status="downloading",
                progress=round(pct, 1),
                speed=d.get("_speed_str", "").strip(),
                eta=d.get("_eta_str", "").strip(),
            )
        elif d["status"] == "finished":
            downloaded_path.append(d["filename"])
            update_job(job_id, status="merging", progress=99)

    postprocessors = []
    if is_audio:
        postprocessors.append({
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        })

    ydl_opts = {
        "format": fmt,
        "outtmpl": str(job_dir / "%(title)s.%(ext)s"),
        "merge_output_format": "mp4",
        "noplaylist": True,
        "progress_hooks": [progress_hook],
        "postprocessors": postprocessors,
        "quiet": True,
        "no_warnings": True,
        "nocheckcertificate": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get("title", "video")

        # 找到实际输出文件
        files = list(job_dir.iterdir())
        if not files:
            raise RuntimeError("下载后未找到文件")

        output_file = max(files, key=lambda f: f.stat().st_size)
        update_job(
            job_id,
            status="done",
            progress=100,
            title=title,
            filename=output_file.name,
            filepath=str(output_file),
        )

    except Exception as e:
        update_job(job_id, status="error", error=str(e))


# ──────────────────────────────────────────────
# 路由
# ──────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/info", methods=["POST"])
def api_info():
    """获取视频基本信息（标题、缩略图、时长）"""
    data = request.get_json(force=True)
    url = (data.get("url") or "").strip()
    if not url:
        return jsonify({"error": "请输入视频链接"}), 400

    try:
        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "nocheckcertificate": True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        duration = info.get("duration", 0)
        minutes, seconds = divmod(int(duration), 60)
        return jsonify({
            "title": info.get("title", ""),
            "thumbnail": info.get("thumbnail", ""),
            "duration": f"{minutes}:{seconds:02d}" if duration else "",
            "uploader": info.get("uploader", ""),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/download", methods=["POST"])
def api_download():
    """启动下载任务，返回 job_id"""
    data = request.get_json(force=True)
    url = (data.get("url") or "").strip()
    quality = (data.get("quality") or "best").strip()

    if not url:
        return jsonify({"error": "请输入视频链接"}), 400
    if quality not in FORMAT_MAP:
        quality = "best"

    clean_old_jobs()

    job_id = uuid.uuid4().hex
    make_job(job_id)

    thread = threading.Thread(target=run_download, args=(job_id, url, quality), daemon=True)
    thread.start()

    return jsonify({"job_id": job_id})


@app.route("/api/progress/<job_id>")
def api_progress(job_id: str):
    """SSE 流：持续推送下载进度，完成或出错后结束"""
    def generate():
        while True:
            job = get_job(job_id)
            if not job:
                data = json.dumps({"status": "error", "error": "任务不存在"})
                yield f"data: {data}\n\n"
                break

            yield f"data: {json.dumps(job)}\n\n"

            if job["status"] in ("done", "error"):
                break

            time.sleep(0.5)

    return Response(generate(), mimetype="text/event-stream",
                    headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.route("/api/file/<job_id>")
def api_file(job_id: str):
    """下载完成后提供文件"""
    job = get_job(job_id)
    if not job or job["status"] != "done":
        return jsonify({"error": "文件未就绪"}), 404

    filepath = job.get("filepath")
    if not filepath or not Path(filepath).exists():
        return jsonify({"error": "文件不存在"}), 404

    filename = job.get("filename", "video.mp4")
    return send_file(
        filepath,
        as_attachment=True,
        download_name=filename,
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    # 局域网可访问
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
