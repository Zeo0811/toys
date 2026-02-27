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

# 自动安装/升级依赖
def ensure_deps():
    # yt-dlp 必须保持最新，旧版本会导致格式识别失败
    print("正在升级 yt-dlp ...")
    subprocess.check_call(
        [sys.executable, "-m", "pip", "install", "--upgrade", "yt-dlp"],
        stdout=subprocess.DEVNULL,
    )
    for package, import_name in [("flask", "flask"), ("deep-translator", "deep_translator")]:
        try:
            __import__(import_name)
        except ImportError:
            print(f"正在安装 {package} ...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])

ensure_deps()

import yt_dlp

app = Flask(__name__)

_BASE_DIR = Path(__file__).parent
DOWNLOAD_DIR = _BASE_DIR / "downloads"
DOWNLOAD_DIR.mkdir(exist_ok=True)

COOKIES_FILE = _BASE_DIR / "cookies.txt"


def _get_base_opts() -> dict:
    """
    动态构建 yt-dlp 基础选项。

    客户端选择：
    - tv_embedded：提供完整 DASH 流（最高 4K），无需 PO Token，支持 cookies 认证
    - web：作兜底，有 PO Token 时可用
    mweb/ios 不提供 DASH 分离流，不能用于高清下载，已排除。
    """
    opts: dict = {
        "quiet": True,
        "no_warnings": True,
        "nocheckcertificate": True,
        "extractor_args": {
            "youtube": {
                # tv_embedded / android_creator：均支持 DASH 高清流，无需 n-challenge JS 解析
                # 严禁加入 web 客户端：web 需要 n-challenge，无 Node.js 时全部格式失效
                "player_client": ["tv_embedded", "android_creator"],
            }
        },
    }
    if COOKIES_FILE.exists():
        opts["cookiefile"] = str(COOKIES_FILE)
    return opts

# 任务状态存储 { job_id: { status, progress, speed, eta, filename, error } }
jobs: dict = {}
jobs_lock = threading.Lock()


# ──────────────────────────────────────────────
# 工具函数
# ──────────────────────────────────────────────

def make_job(job_id: str, url: str = ""):
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
            "url": url,
            "created_at": time.time(),
            "completed_at": None,
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
VERSION = "0.9"

# 下载核心
# ──────────────────────────────────────────────

# 使用 ffmpeg 合并最佳音视频流（ffmpeg 已通过 nixpacks/render.yaml 安装）
# 不加 ext 限制，避免某些视频因无 mp4 流而误报"格式不可用"
# 用 format_sort 在 ydl_opts 中表达 mp4 偏好，不影响兜底逻辑
FORMAT_MAP = {
    "best":  "bestvideo+bestaudio/bestvideo/best",
    "1080p": "bestvideo[height<=1080]+bestaudio/best[height<=1080]/bestvideo+bestaudio/best",
    "720p":  "bestvideo[height<=720]+bestaudio/best[height<=720]/bestvideo+bestaudio/best",
    "480p":  "bestvideo[height<=480]+bestaudio/best[height<=480]/bestvideo+bestaudio/best",
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


def _fix_srt_overlaps(srt_path: Path) -> Path:
    """修复 SRT 字幕时间戳重叠，确保每条字幕开始时间不早于上一条结束时间。"""
    content = srt_path.read_text(encoding="utf-8", errors="replace")
    entries = re.split(r"\n\s*\n", content.strip())
    fixed, prev_end_ms = [], 0

    def _ms(ts: str) -> int:
        m = re.match(r"(\d{2}):(\d{2}):(\d{2})[,.](\d{3})", ts)
        if not m:
            return 0
        h, mn, s, ms = map(int, m.groups())
        return (h * 3600 + mn * 60 + s) * 1000 + ms

    def _fmt(ms: int) -> str:
        h = ms // 3600000; ms %= 3600000
        mn = ms // 60000;  ms %= 60000
        s = ms // 1000;    ms %= 1000
        return f"{h:02d}:{mn:02d}:{s:02d},{ms:03d}"

    for entry in entries:
        lines = entry.strip().splitlines()
        if len(lines) < 3:
            continue
        tc = re.match(r"(\S+)\s*-->\s*(\S+)", lines[1])
        if not tc:
            fixed.append(entry)
            continue
        start_ms, end_ms = _ms(tc.group(1)), _ms(tc.group(2))
        if start_ms < prev_end_ms:
            start_ms = prev_end_ms + 50
            if start_ms >= end_ms:
                end_ms = start_ms + 1000
        prev_end_ms = end_ms
        fixed.append(f"{lines[0]}\n{_fmt(start_ms)} --> {_fmt(end_ms)}\n" + "\n".join(lines[2:]))

    srt_path.write_text("\n\n".join(fixed) + "\n", encoding="utf-8")
    return srt_path


def _translate_srt_to_chinese(srt_path: Path) -> Path:
    """
    将 SRT 字幕翻译为简体中文，使用 Google Translate（deep-translator）。
    翻译后自动修复时间戳重叠。
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
    SEPARATOR = "\n◆◆◆\n"
    BATCH_SIZE = 15
    translated: list[str] = [""] * len(texts)

    for start in range(0, len(texts), BATCH_SIZE):
        batch = texts[start: start + BATCH_SIZE]
        combined = SEPARATOR.join(batch)
        if len(combined) > 4500:
            for i, text in enumerate(batch):
                try:
                    t = GoogleTranslator(source="auto", target="zh-CN").translate(text[:4000])
                    translated[start + i] = t or text
                except Exception:
                    translated[start + i] = text
        else:
            try:
                result = GoogleTranslator(source="auto", target="zh-CN").translate(combined)
                parts = re.split(r"◆+", result or "")
                for i, part in enumerate(parts):
                    if i < len(batch):
                        translated[start + i] = part.strip()
            except Exception:
                for i, text in enumerate(batch):
                    translated[start + i] = text

        for i in range(start, min(start + BATCH_SIZE, len(texts))):
            if not translated[i]:
                translated[i] = texts[i]
        time.sleep(0.3)

    out_blocks = [
        f"{m.group(1)}\n{m.group(2)}\n{translated[i]}\n"
        for i, m in enumerate(matches)
    ]
    out_path = srt_path.parent / (srt_path.stem + ".zh.srt")
    out_path.write_text("\n".join(out_blocks), encoding="utf-8")
    return _fix_srt_overlaps(out_path)


def _burn_subtitle(video_path: Path, sub_path: Path, output_path: Path) -> None:
    """用 ffmpeg 将字幕硬烧录到视频（需要 libass + Noto CJK 字体）。"""
    simple_sub = video_path.parent / "burn_sub.srt"
    shutil.copy(str(sub_path), str(simple_sub))
    abs_sub = str(simple_sub.resolve()).replace("\\", "\\\\").replace(":", "\\:")

    # 使用 Noto Sans CJK SC 确保中文字符正确渲染
    # fonts-noto-cjk 已在 Dockerfile/render.yaml 中安装
    style = (
        "FontName=Noto Sans CJK SC,"
        "FontSize=24,"
        "PrimaryColour=&H00ffffff,"
        "OutlineColour=&H00000000,"
        "Outline=2,"
        "Shadow=1,"
        "Bold=0,"
        "MarginV=20"
    )
    cmd = [
        "ffmpeg", "-y",
        "-i", str(video_path),
        "-vf", f"subtitles={abs_sub}:force_style='{style}'",
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
            "ffmpeg 字幕烧录失败：" + result.stderr.decode(errors="replace")[-800:]
        )


def _download_subtitle(url: str, job_dir: Path) -> Path | None:
    """单独下载字幕，429/网络错误时返回 None（优雅降级）。"""
    import time
    sub_opts = {
        **_get_base_opts(),
        "skip_download": True,
        "writesubtitles": True,
        "writeautomaticsub": True,
        "subtitleslangs": ["zh-Hans", "zh-TW", "zh", "en", "en-US"],
        "subtitlesformat": "srt/vtt/best",
        "outtmpl": str(job_dir / "%(title)s.%(ext)s"),
        "retries": 3,
        "sleep_interval": 2,
        "max_sleep_interval": 8,
    }
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
        **_get_base_opts(),
        "format": fmt,
        "format_sort": ["ext:mp4:m4a:webm", "res", "size"],  # 偏好 mp4 但不强制
        "outtmpl": str(job_dir / "%(title)s.%(ext)s"),
        "noplaylist": True,
        "progress_hooks": [progress_hook],
        "postprocessors": postprocessors,
    }
    if not is_audio:
        ydl_opts["merge_output_format"] = "mp4"

    def _do_download(opts):
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
            return info.get("title", "video")

    try:
        try:
            title = _do_download(ydl_opts)
        except Exception as e:
            if "Requested format is not available" in str(e):
                # 清空临时文件，用最简格式兜底重试（不附加任何画质限制）
                for f in job_dir.iterdir():
                    f.unlink(missing_ok=True)
                update_job(job_id, status="downloading", progress=0)
                fallback_opts = {**ydl_opts, "format": "best", "format_sort": []}
                title = _do_download(fallback_opts)
            else:
                raise

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

                # 烧录（失败时降级：保留原视频，不报错）
                update_job(job_id, status="burning", progress=99)
                burned_output = output_file.parent / (output_file.stem + "_subbed.mp4")
                try:
                    _burn_subtitle(output_file, sub_file, burned_output)
                    # 用烧录后文件替代原文件
                    output_file.unlink(missing_ok=True)
                    output_file = burned_output
                except Exception as burn_err:
                    # 烧录失败：清理临时文件，继续使用原视频
                    burned_output.unlink(missing_ok=True)
                    update_job(job_id, error=f"字幕烧录失败（已返回原视频）：{burn_err}")
            # 若无字幕或烧录失败，忽略字幕步骤，直接返回原视频

        update_job(
            job_id,
            status="done",
            progress=100,
            title=title,
            filename=output_file.name,
            filepath=str(output_file),
            completed_at=time.time(),
        )

    except Exception as e:
        update_job(job_id, status="error", error=str(e), completed_at=time.time())


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
        ydl_opts = {**_get_base_opts(), "skip_download": True}
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
    make_job(job_id, url=url)

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
        # 等待任务出现（最多 5s）：防止 SSE 在 make_job 之前到达的竞态，
        # 也兼容 Render 零停机发布时新实例短暂无任务的情况
        deadline = time.time() + 5
        while not get_job(job_id) and time.time() < deadline:
            time.sleep(0.3)

        while True:
            job = get_job(job_id)
            if not job:
                data = json.dumps({"status": "error", "error": "服务已重启，请重新下载"})
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


@app.route("/api/history")
def api_history():
    """返回最近 20 条已完成的下载记录"""
    with jobs_lock:
        done = [
            {
                "job_id": jid,
                "title": info.get("title", ""),
                "filename": info.get("filename", ""),
                "url": info.get("url", ""),
                "completed_at": info.get("completed_at"),
                "status": info.get("status"),
            }
            for jid, info in jobs.items()
            if info.get("status") in ("done", "error")
        ]
    done.sort(key=lambda x: x.get("completed_at") or 0, reverse=True)
    return jsonify(done[:20])


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


@app.route("/api/cookies/check", methods=["POST"])
def api_cookies_check():
    """验证 cookies 是否仍然有效（用一个简短的 YouTube 请求测试）。"""
    if not COOKIES_FILE.exists():
        return jsonify({"valid": False, "reason": "未上传 Cookie"})
    try:
        opts = {**_get_base_opts(), "skip_download": True, "quiet": True, "no_warnings": True}
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.extract_info("https://www.youtube.com/watch?v=BjUShsxq4wU", download=False)
        return jsonify({"valid": True})
    except Exception as e:
        msg = str(e)
        if "Sign in" in msg or "bot" in msg.lower():
            return jsonify({"valid": False, "reason": "Cookie 已失效，请重新上传"})
        return jsonify({"valid": True})  # 其他错误不代表 cookie 无效


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    # 局域网可访问
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
