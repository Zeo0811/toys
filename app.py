#!/usr/bin/env python3
"""
移动端视频下载 Web 应用
支持 YouTube 及 yt-dlp 兼容的视频网站
依赖: pip install flask yt-dlp deep-translator
"""

import os
import re
import sys
import uuid
import json
import time
import shutil
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
    try:
        import deep_translator
    except ImportError:
        print("正在安装 deep-translator ...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "deep-translator"])

ensure_deps()

import yt_dlp

app = Flask(__name__)

DOWNLOAD_DIR = Path("downloads")
DOWNLOAD_DIR.mkdir(exist_ok=True)

COOKIES_FILE = Path("cookies.txt")

# 任务状态存储 { job_id: { status, progress, speed, eta, filename, error } }
jobs: dict = {}
jobs_lock = threading.Lock()


# ──────────────────────────────────────────────
# 工具函数
# ──────────────────────────────────────────────

def make_job(job_id: str):
    with jobs_lock:
        jobs[job_id] = {
            "status": "pending",   # pending | downloading | translating | burning | done | error
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
VERSION = "0.7"

# 下载核心
# ──────────────────────────────────────────────

# 使用 ffmpeg 合并最佳音视频流（ffmpeg 已通过 nixpacks/render.yaml 安装）
FORMAT_MAP = {
    "best":  "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best",
    "1080p": "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]",
    "720p":  "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]",
    "480p":  "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480]",
    "audio": "bestaudio/best",
}


# ──────────────────────────────────────────────
# 字幕相关工具
# ──────────────────────────────────────────────

def _find_subtitle(job_dir: Path) -> Path | None:
    """在 job_dir 中查找字幕文件，优先返回中文，其次英文，最后任意字幕。"""
    priority = [".zh-Hans.srt", ".zh-TW.srt", ".zh.srt",
                ".zh-Hans.vtt", ".zh-TW.vtt", ".zh.vtt",
                ".en.srt", ".en-US.srt", ".en.vtt", ".en-US.vtt"]
    for suffix in priority:
        matches = list(job_dir.glob(f"*{suffix}"))
        if matches:
            return matches[0]
    # 任意字幕
    for ext in ("*.srt", "*.vtt"):
        matches = list(job_dir.glob(ext))
        if matches:
            return matches[0]
    return None


def _is_chinese_subtitle(path: Path) -> bool:
    """判断字幕文件名是否已是中文（zh）字幕。"""
    name = path.name.lower()
    return any(tag in name for tag in (".zh-hans.", ".zh-tw.", ".zh."))


def _convert_vtt_to_srt(vtt_path: Path) -> Path:
    """将 VTT 字幕转换为 SRT 格式（通过 ffmpeg）。"""
    srt_path = vtt_path.with_suffix(".srt")
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(vtt_path), str(srt_path)],
        capture_output=True,
    )
    return srt_path if srt_path.exists() else vtt_path


def _translate_srt_to_chinese(srt_path: Path) -> Path:
    """
    将 SRT 字幕翻译为简体中文。
    返回翻译后的 SRT 文件路径；如遇任何错误则返回原始路径。
    """
    try:
        from deep_translator import GoogleTranslator
    except ImportError:
        return srt_path

    try:
        content = srt_path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return srt_path

    # 解析 SRT：提取 (序号行, 时间轴行, 文本行)
    block_re = re.compile(
        r"(\d+)\s*\n"
        r"(\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*\n"
        r"((?:.+\n?)+)",
        re.MULTILINE,
    )
    matches = list(block_re.finditer(content))
    if not matches:
        return srt_path

    texts = [m.group(3).strip() for m in matches]

    # 分批翻译（每批最多 15 段，用罕见分隔符拼接）
    SEPARATOR = "\n◆◆◆\n"
    BATCH_SIZE = 15
    translated: list[str] = [""] * len(texts)

    for start in range(0, len(texts), BATCH_SIZE):
        batch = texts[start: start + BATCH_SIZE]
        combined = SEPARATOR.join(batch)

        # 若拼合后超长，逐条翻译
        if len(combined) > 4500:
            for i, text in enumerate(batch):
                try:
                    t = GoogleTranslator(source="auto", target="zh-CN").translate(
                        text[:4000]
                    )
                    translated[start + i] = t or text
                except Exception:
                    translated[start + i] = text
        else:
            try:
                result = GoogleTranslator(source="auto", target="zh-CN").translate(combined)
                # 按分隔符切回（允许翻译后分隔符有轻微变化）
                parts = re.split(r"◆+", result or "")
                for i, part in enumerate(parts):
                    if i < len(batch):
                        translated[start + i] = part.strip()
            except Exception:
                for i, text in enumerate(batch):
                    translated[start + i] = text

        # 填补空缺
        for i in range(start, min(start + BATCH_SIZE, len(texts))):
            if not translated[i]:
                translated[i] = texts[i]

        time.sleep(0.3)  # 避免请求过于密集

    # 重建 SRT
    out_blocks = [
        f"{m.group(1)}\n{m.group(2)}\n{translated[i]}\n"
        for i, m in enumerate(matches)
    ]
    out_path = srt_path.parent / (srt_path.stem + ".zh.srt")
    out_path.write_text("\n".join(out_blocks), encoding="utf-8")
    return out_path


def _burn_subtitle(video_path: Path, sub_path: Path, output_path: Path) -> None:
    """用 ffmpeg 将字幕硬烧录到视频。"""
    # 将字幕复制为简单文件名，避免路径特殊字符影响 ffmpeg 过滤器
    simple_sub = video_path.parent / "burn_sub.srt"
    shutil.copy(str(sub_path), str(simple_sub))

    style = (
        "FontSize=26,"
        "PrimaryColour=&H00ffffff,"
        "OutlineColour=&H00000000,"
        "Outline=2,"
        "Shadow=1,"
        "Bold=0"
    )
    cmd = [
        "ffmpeg", "-y",
        "-i", str(video_path),
        "-vf", f"subtitles=burn_sub.srt:force_style='{style}'",
        "-c:a", "copy",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        str(output_path),
    ]
    result = subprocess.run(cmd, capture_output=True, cwd=str(video_path.parent))
    simple_sub.unlink(missing_ok=True)
    if result.returncode != 0:
        raise RuntimeError(
            "ffmpeg 字幕烧录失败：" + result.stderr.decode(errors="replace")[-400:]
        )


def _download_subtitle(url: str, job_dir: Path) -> Path | None:
    """单独下载字幕，429/网络错误时返回 None（优雅降级）。"""
    import time
    sub_opts = {
        "skip_download": True,
        "writesubtitles": True,
        "writeautomaticsub": True,
        "subtitleslangs": ["zh-Hans", "zh-TW", "zh", "en", "en-US"],
        "subtitlesformat": "srt/vtt/best",
        "outtmpl": str(job_dir / "%(title)s.%(ext)s"),
        "quiet": True,
        "no_warnings": True,
        "nocheckcertificate": True,
        "retries": 3,
        "sleep_interval": 2,
        "max_sleep_interval": 8,
    }
    if COOKIES_FILE.exists():
        sub_opts["cookiefile"] = str(COOKIES_FILE)
    for attempt in range(3):
        try:
            with yt_dlp.YoutubeDL(sub_opts) as ydl:
                ydl.download([url])
            found = _find_subtitle(job_dir)
            if found:
                return found
        except Exception:
            pass
        if attempt < 2:
            time.sleep(2 ** (attempt + 1))  # 2s, 4s
    return None


# ──────────────────────────────────────────────
# 下载主逻辑
# ──────────────────────────────────────────────

def run_download(job_id: str, url: str, quality: str, burn_subtitle: bool = False):
    job_dir = DOWNLOAD_DIR / job_id
    job_dir.mkdir(exist_ok=True)

    fmt = FORMAT_MAP.get(quality, FORMAT_MAP["best"])
    is_audio = quality == "audio"

    # 音频模式不支持字幕烧录
    if is_audio:
        burn_subtitle = False

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
            update_job(job_id, status="merging", progress=99)

    postprocessors = []
    if is_audio:
        postprocessors = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }]

    ydl_opts = {
        "format": fmt,
        "outtmpl": str(job_dir / "%(title)s.%(ext)s"),
        "noplaylist": True,
        "progress_hooks": [progress_hook],
        "postprocessors": postprocessors,
        "quiet": True,
        "no_warnings": True,
        "nocheckcertificate": True,
    }
    if COOKIES_FILE.exists():
        ydl_opts["cookiefile"] = str(COOKIES_FILE)
    if not is_audio:
        ydl_opts["merge_output_format"] = "mp4"

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get("title", "video")

        # 找到视频文件（最大文件）
        video_files = [
            f for f in job_dir.iterdir()
            if f.suffix in (".mp4", ".mkv", ".webm", ".mov", ".avi")
        ]
        if not video_files:
            all_files = list(job_dir.iterdir())
            if not all_files:
                raise RuntimeError("下载后未找到文件")
            output_file = max(all_files, key=lambda f: f.stat().st_size)
        else:
            output_file = max(video_files, key=lambda f: f.stat().st_size)

        # ── 字幕烧录流程 ──
        if burn_subtitle:
            # 单独下载字幕，失败时优雅降级（不影响视频）
            sub_file = _download_subtitle(url, job_dir)
            if sub_file is None:
                sub_file = _find_subtitle(job_dir)

            if sub_file:
                # 如果是 VTT，先转 SRT
                if sub_file.suffix.lower() == ".vtt":
                    sub_file = _convert_vtt_to_srt(sub_file)

                # 如果不是中文字幕，翻译
                if not _is_chinese_subtitle(sub_file):
                    update_job(job_id, status="translating", progress=99)
                    sub_file = _translate_srt_to_chinese(sub_file)

                # 烧录
                update_job(job_id, status="burning", progress=99)
                burned_output = output_file.parent / (output_file.stem + "_subbed.mp4")
                _burn_subtitle(output_file, sub_file, burned_output)
                # 用烧录后文件替代原文件
                output_file.unlink(missing_ok=True)
                output_file = burned_output
            # 若无字幕，忽略烧录步骤，直接返回原视频

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
    return render_template("index.html", version=VERSION)


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
    burn_subtitle = bool(data.get("burn_subtitle", False))

    if not url:
        return jsonify({"error": "请输入视频链接"}), 400
    if quality not in FORMAT_MAP:
        quality = "best"

    clean_old_jobs()

    job_id = uuid.uuid4().hex
    make_job(job_id)

    thread = threading.Thread(
        target=run_download,
        args=(job_id, url, quality, burn_subtitle),
        daemon=True,
    )
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


@app.route("/api/cookies/status")
def api_cookies_status():
    return jsonify({"configured": COOKIES_FILE.exists()})


@app.route("/api/cookies/upload", methods=["POST"])
def api_cookies_upload():
    f = request.files.get("file")
    if not f:
        return jsonify({"error": "未收到文件"}), 400
    f.save(str(COOKIES_FILE))
    return jsonify({"ok": True})


@app.route("/api/cookies/delete", methods=["POST"])
def api_cookies_delete():
    COOKIES_FILE.unlink(missing_ok=True)
    return jsonify({"ok": True})


@app.route("/api/cookies/from-browser", methods=["POST"])
def api_cookies_from_browser():
    data = request.get_json(silent=True) or {}
    browser = data.get("browser", "").lower().strip()
    supported = ["chrome", "firefox", "edge", "brave", "opera", "chromium", "vivaldi"]
    if browser not in supported:
        return jsonify({"error": f"不支持的浏览器：{browser}"}), 400

    try:
        ydl_opts = {
            "cookiesfrombrowser": (browser, None, None, None),
            "cookiefile": str(COOKIES_FILE),
            "quiet": True,
            "no_warnings": True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl._setup_opener()
            jar = ydl.cookiejar
            if hasattr(jar, "save"):
                jar.save(ignore_discard=True, ignore_expires=True)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    # 局域网可访问
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
