#!/usr/bin/env python3
"""
YouTube 视频下载 Web 服务

运行方式:
    python web_downloader.py

然后在手机浏览器输入屏幕显示的地址即可访问（手机与电脑需在同一 Wi-Fi）
"""

import os
import sys
import json
import time
import uuid
import socket
import tempfile
import threading
import subprocess
from pathlib import Path


def ensure_deps() -> None:
    """自动安装所需依赖"""
    missing = []
    for package, import_name in [("flask", "flask"), ("yt-dlp", "yt_dlp")]:
        try:
            __import__(import_name)
        except ImportError:
            missing.append(package)
    if missing:
        print(f"正在安装依赖: {', '.join(missing)} ...")
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install"] + missing,
            stdout=subprocess.DEVNULL,
        )
        print("依赖安装完成\n")


ensure_deps()

from flask import Flask, request, jsonify, send_file, Response  # noqa: E402
import yt_dlp  # noqa: E402

app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False

# 下载任务存储（内存中）
tasks: dict[str, dict] = {}

DOWNLOAD_DIR = Path(tempfile.mkdtemp(prefix="yt_web_"))

FORMAT_MAP = {
    "best":  "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best",
    "1080p": "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]",
    "720p":  "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]",
    "480p":  "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480]",
    "audio": "bestaudio/best",
}


def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"


# ─── HTML 前端页面 ──────────────────────────────────────────────────────────────

HTML_PAGE = """\
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#0f1923">
<title>YouTube 下载器</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  background:linear-gradient(160deg,#0f1923 0%,#1a2740 60%,#0d1520 100%);
  min-height:100vh;color:#fff;padding:16px;
}
.wrap{max-width:480px;margin:0 auto;padding-top:28px}
/* 头部 */
header{text-align:center;margin-bottom:24px}
.logo{font-size:40px;line-height:1;margin-bottom:8px}
h1{font-size:22px;font-weight:700;letter-spacing:-.3px}
.sub{font-size:13px;color:rgba(255,255,255,.4);margin-top:4px}
/* 卡片 */
.card{
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.08);
  border-radius:20px;padding:20px;margin-bottom:12px;
}
/* URL 输入 */
.url-row{display:flex;gap:8px;margin-bottom:14px}
.url-input{
  flex:1;min-width:0;
  background:rgba(255,255,255,.07);
  border:1.5px solid rgba(255,255,255,.12);
  border-radius:12px;padding:13px 14px;
  color:#fff;font-size:14px;outline:none;
  transition:border-color .2s;
}
.url-input::placeholder{color:rgba(255,255,255,.28)}
.url-input:focus{border-color:#ff4500}
.paste-btn{
  flex-shrink:0;
  background:rgba(255,69,0,.14);
  border:1.5px solid rgba(255,69,0,.28);
  border-radius:12px;padding:13px 15px;
  color:#ff7043;font-size:13px;font-weight:600;
  cursor:pointer;white-space:nowrap;transition:background .2s;
}
.paste-btn:active{background:rgba(255,69,0,.28)}
/* 视频预览 */
.preview{
  display:none;align-items:flex-start;gap:12px;
  background:rgba(255,255,255,.04);
  border-radius:12px;padding:12px;margin-bottom:14px;
}
.preview.show{display:flex}
.thumb{width:90px;height:58px;border-radius:8px;object-fit:cover;background:#1e2d40;flex-shrink:0}
.pinfo{flex:1;min-width:0}
.ptitle{
  font-size:13px;font-weight:600;line-height:1.4;
  display:-webkit-box;-webkit-line-clamp:2;
  -webkit-box-orient:vertical;overflow:hidden;
}
.pmeta{font-size:11px;color:rgba(255,255,255,.38);margin-top:4px}
/* 画质选择 */
.sec-label{
  font-size:11px;color:rgba(255,255,255,.4);
  text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;
}
.q-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px}
.q-btn{
  background:rgba(255,255,255,.07);
  border:1.5px solid rgba(255,255,255,.12);
  border-radius:20px;padding:7px 15px;
  color:rgba(255,255,255,.65);font-size:13px;
  cursor:pointer;transition:all .15s;
}
.q-btn.active{
  background:linear-gradient(135deg,#e60000,#ff4500);
  border-color:transparent;color:#fff;font-weight:600;
}
/* 下载按钮 */
.dl-btn{
  width:100%;padding:15px;
  background:linear-gradient(135deg,#e60000,#ff4500);
  border:none;border-radius:14px;color:#fff;
  font-size:16px;font-weight:700;cursor:pointer;
  transition:opacity .2s,transform .1s;letter-spacing:.3px;
}
.dl-btn:active{transform:scale(.97)}
.dl-btn:disabled{opacity:.38;cursor:not-allowed;transform:none}
/* 错误提示 */
.err{
  display:none;margin-top:12px;padding:10px 13px;
  background:rgba(255,80,80,.1);
  border:1px solid rgba(255,80,80,.25);
  border-radius:10px;font-size:13px;color:#ff8080;line-height:1.5;
}
.err.show{display:block}
/* 进度区 */
.prog-wrap{display:none;margin-top:18px}
.prog-wrap.show{display:block}
.status-row{display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:11px}
.spinner{
  width:16px;height:16px;flex-shrink:0;
  border:2px solid rgba(255,255,255,.15);
  border-top-color:#ff4500;border-radius:50%;
  animation:spin .75s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}
.bar-bg{background:rgba(255,255,255,.08);border-radius:6px;height:6px;overflow:hidden}
.bar-fill{
  height:100%;border-radius:6px;width:0%;
  background:linear-gradient(90deg,#e60000,#ff4500);
  transition:width .35s ease;
}
.bar-meta{
  display:flex;justify-content:space-between;
  font-size:11px;color:rgba(255,255,255,.38);margin-top:7px;
}
/* 完成区 */
.done-wrap{display:none;margin-top:14px}
.done-wrap.show{display:block}
.save-btn{
  display:block;width:100%;padding:15px;
  background:linear-gradient(135deg,#00b974,#009e5f);
  border:none;border-radius:14px;color:#fff;
  font-size:16px;font-weight:700;
  text-align:center;text-decoration:none;
  cursor:pointer;transition:opacity .2s;
}
.save-btn:active{opacity:.82}
.ios-hint{
  margin-top:10px;padding:11px 13px;
  background:rgba(255,204,0,.07);
  border:1px solid rgba(255,204,0,.2);
  border-radius:10px;font-size:12px;
  color:rgba(255,220,100,.8);line-height:1.65;
  display:none;
}
/* 页脚 */
footer{
  text-align:center;padding:20px 0 28px;
  font-size:11px;color:rgba(255,255,255,.18);
  line-height:1.6;
}
</style>
</head>
<body>
<div class="wrap">

  <header>
    <div class="logo">🎬</div>
    <h1>YouTube 下载器</h1>
    <p class="sub">输入链接，一键下载高清视频到本地</p>
  </header>

  <div class="card">

    <!-- URL 输入 -->
    <div class="url-row">
      <input type="url" id="urlInput" class="url-input"
             placeholder="粘贴 YouTube 链接..."
             autocomplete="off" autocorrect="off"
             autocapitalize="none" spellcheck="false">
      <button class="paste-btn" onclick="pasteUrl()">粘贴</button>
    </div>

    <!-- 视频预览 -->
    <div class="preview" id="preview">
      <img class="thumb" id="thumb" src="" alt="">
      <div class="pinfo">
        <div class="ptitle" id="ptitle"></div>
        <div class="pmeta" id="pmeta"></div>
      </div>
    </div>

    <!-- 画质选择 -->
    <div class="sec-label">选择画质</div>
    <div class="q-row" id="qRow">
      <button class="q-btn active" data-q="best">最高画质</button>
      <button class="q-btn" data-q="1080p">1080p</button>
      <button class="q-btn" data-q="720p">720p</button>
      <button class="q-btn" data-q="480p">480p</button>
      <button class="q-btn" data-q="audio">仅音频</button>
    </div>

    <!-- 下载按钮 -->
    <button class="dl-btn" id="dlBtn" onclick="startDl()">⬇&nbsp; 开始下载</button>

    <!-- 错误提示 -->
    <div class="err" id="errMsg"></div>

    <!-- 进度 -->
    <div class="prog-wrap" id="progWrap">
      <div class="status-row">
        <div class="spinner"></div>
        <span id="statusTxt">准备中...</span>
      </div>
      <div class="bar-bg"><div class="bar-fill" id="barFill"></div></div>
      <div class="bar-meta">
        <span id="pctTxt">0%</span>
        <span id="speedTxt"></span>
        <span id="etaTxt"></span>
      </div>
    </div>

    <!-- 完成 / 保存 -->
    <div class="done-wrap" id="doneWrap">
      <a class="save-btn" id="saveLink" href="#" download>⬇&nbsp; 保存到本地</a>
      <div class="ios-hint" id="iosHint">
        📱 <strong>iPhone 用户：</strong>点击上方按钮后，在弹出菜单选
        <strong>「下载」</strong>，视频会存入<strong>文件 App</strong>。
        如需存入相册，在文件 App 中长按视频 → 「存储到照片」。
      </div>
    </div>

  </div><!-- /card -->

  <footer>
    需要安装 ffmpeg 才能合并最高画质音视频<br>
    仅供个人学习使用，请勿下载版权受保护内容
  </footer>

</div><!-- /wrap -->

<script>
var quality = 'best';
var evtSrc  = null;
var isIOS   = /iPad|iPhone|iPod/.test(navigator.userAgent);

/* ── 画质按钮 ── */
document.getElementById('qRow').addEventListener('click', function(e) {
  var btn = e.target.closest('.q-btn');
  if (!btn) return;
  document.querySelectorAll('.q-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  quality = btn.dataset.q;
});

/* ── URL 变化时获取视频信息 ── */
var infoTimer;
document.getElementById('urlInput').addEventListener('input', function() {
  clearTimeout(infoTimer);
  infoTimer = setTimeout(fetchInfo, 850);
});

async function pasteUrl() {
  try {
    var text = await navigator.clipboard.readText();
    document.getElementById('urlInput').value = text;
    fetchInfo();
  } catch(e) {
    /* 权限不足时让用户手动粘贴 */
    var inp = document.getElementById('urlInput');
    inp.focus();
    inp.select();
  }
}

async function fetchInfo() {
  var url = document.getElementById('urlInput').value.trim();
  if (!url.includes('youtube') && !url.includes('youtu.be')) return;
  try {
    var res = await fetch('/api/info', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({url: url})
    });
    var d = await res.json();
    if (d.title) {
      document.getElementById('thumb').src   = d.thumbnail || '';
      document.getElementById('ptitle').textContent = d.title;
      document.getElementById('pmeta').textContent  =
        [d.duration_str, d.channel].filter(Boolean).join(' · ');
      document.getElementById('preview').classList.add('show');
    }
  } catch(e) {}
}

/* ── 开始下载 ── */
async function startDl() {
  var url = document.getElementById('urlInput').value.trim();
  if (!url) { showErr('请输入 YouTube 视频链接'); return; }

  /* 重置 UI */
  showErr('');
  document.getElementById('doneWrap').classList.remove('show');
  document.getElementById('progWrap').classList.add('show');
  document.getElementById('dlBtn').disabled = true;
  setProgress(0, '连接中...', '', '');
  if (evtSrc) { evtSrc.close(); evtSrc = null; }

  try {
    var res = await fetch('/api/start', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({url: url, quality: quality})
    });
    var d = await res.json();
    if (d.error) { showErr(d.error); resetBtn(); return; }
    listenProgress(d.task_id);
  } catch(e) {
    showErr('网络错误，请检查连接后重试');
    resetBtn();
  }
}

/* ── SSE 进度监听 ── */
function listenProgress(taskId) {
  evtSrc = new EventSource('/api/progress/' + taskId);
  evtSrc.onmessage = function(e) {
    var d = JSON.parse(e.data);
    if (d.status === 'downloading') {
      setProgress(d.progress || 0, '下载中...', d.speed || '', d.eta || '');
    } else if (d.status === 'processing') {
      setProgress(99, '合并音视频中...', '', '');
    } else if (d.status === 'done') {
      evtSrc.close();
      setProgress(100, '下载完成！', '', '');
      showDone(taskId, d.filename || 'video.mp4');
      resetBtn();
    } else if (d.status === 'error') {
      evtSrc.close();
      showErr(d.error || '下载失败，请检查链接是否有效');
      resetBtn();
    }
  };
  evtSrc.onerror = function() {
    evtSrc.close();
    showErr('连接中断，请重试');
    resetBtn();
  };
}

function setProgress(pct, status, speed, eta) {
  document.getElementById('barFill').style.width  = pct + '%';
  document.getElementById('pctTxt').textContent   = Math.round(pct) + '%';
  document.getElementById('speedTxt').textContent = speed;
  document.getElementById('etaTxt').textContent   = eta ? '剩余 ' + eta : '';
  document.getElementById('statusTxt').textContent = status;
}

function showDone(taskId, filename) {
  var a = document.getElementById('saveLink');
  a.href     = '/api/file/' + taskId;
  a.download = filename;
  document.getElementById('doneWrap').classList.add('show');
  if (isIOS) document.getElementById('iosHint').style.display = 'block';
}

function showErr(msg) {
  var el = document.getElementById('errMsg');
  el.textContent = msg;
  el.classList.toggle('show', !!msg);
}

function resetBtn() {
  document.getElementById('dlBtn').disabled = false;
}
</script>
</body>
</html>
"""


# ─── API 路由 ──────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return HTML_PAGE, 200, {"Content-Type": "text/html; charset=utf-8"}


@app.route("/api/info", methods=["POST"])
def api_info():
    """快速获取视频标题、封面等信息（不下载）"""
    url = (request.json or {}).get("url", "").strip()
    if not url:
        return jsonify({"error": "链接不能为空"}), 400
    try:
        ydl_opts = {"quiet": True, "noplaylist": True, "skip_download": True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
        duration = info.get("duration") or 0
        m, s = divmod(int(duration), 60)
        h, m = divmod(m, 60)
        dur_str = f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"
        thumbnails = info.get("thumbnails") or []
        thumb = thumbnails[-1]["url"] if thumbnails else None
        return jsonify({
            "title":        info.get("title", ""),
            "channel":      info.get("uploader", ""),
            "duration_str": dur_str,
            "thumbnail":    thumb,
        })
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/api/start", methods=["POST"])
def api_start():
    """启动后台下载任务，返回 task_id"""
    data    = request.json or {}
    url     = data.get("url", "").strip()
    quality = data.get("quality", "best")
    if not url:
        return jsonify({"error": "链接不能为空"}), 400
    if quality not in FORMAT_MAP:
        quality = "best"
    task_id = str(uuid.uuid4())
    tasks[task_id] = {
        "status": "pending", "progress": 0,
        "speed": "", "eta": "", "error": "",
        "filename": "", "filepath": "",
    }
    thread = threading.Thread(
        target=run_download, args=(task_id, url, quality), daemon=True
    )
    thread.start()
    return jsonify({"task_id": task_id})


def run_download(task_id: str, url: str, quality: str) -> None:
    """后台下载线程"""
    task    = tasks[task_id]
    out_dir = DOWNLOAD_DIR / task_id
    out_dir.mkdir(parents=True, exist_ok=True)

    def progress_hook(d: dict) -> None:
        if d["status"] == "downloading":
            total      = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            downloaded = d.get("downloaded_bytes", 0)
            if total:
                pct = downloaded / total * 100
            else:
                fi = d.get("fragment_index", 0)
                fc = d.get("fragment_count", 0)
                pct = fi / fc * 100 if fc else 50
            task.update({
                "status":   "downloading",
                "progress": round(pct, 1),
                "speed":    d.get("_speed_str", "").strip(),
                "eta":      d.get("_eta_str", "").strip(),
            })
        elif d["status"] == "finished":
            task.update({"status": "processing", "progress": 99})

    post_processors = []
    if quality == "audio":
        post_processors = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }]

    ydl_opts = {
        "format":               FORMAT_MAP[quality],
        "outtmpl":              str(out_dir / "%(title)s.%(ext)s"),
        "merge_output_format":  "mp4",
        "noplaylist":           True,
        "quiet":                True,
        "no_warnings":          True,
        "progress_hooks":       [progress_hook],
        "postprocessors":       post_processors,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)

        # 找到最大的输出文件
        files = sorted(out_dir.iterdir(), key=lambda f: f.stat().st_size, reverse=True)
        if not files:
            raise RuntimeError("下载完成但未找到文件")
        filepath = files[0]
        task.update({
            "status":   "done",
            "progress": 100,
            "filepath": str(filepath),
            "filename": filepath.name,
            "title":    info.get("title", filepath.stem),
        })
    except Exception as exc:
        task.update({"status": "error", "error": str(exc)})


@app.route("/api/progress/<task_id>")
def api_progress(task_id: str):
    """Server-Sent Events：实时推送下载进度"""
    def event_stream():
        for _ in range(1200):          # 最多轮询 10 分钟
            task = tasks.get(task_id, {"status": "error", "error": "任务不存在"})
            yield f"data: {json.dumps(task, ensure_ascii=False)}\n\n"
            if task.get("status") in ("done", "error"):
                break
            time.sleep(0.5)

    return Response(
        event_stream(),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.route("/api/file/<task_id>")
def api_file(task_id: str):
    """将已下载文件推送给浏览器（触发手机保存）"""
    task = tasks.get(task_id, {})
    if task.get("status") != "done":
        return jsonify({"error": "文件未准备好"}), 404
    filepath = task.get("filepath", "")
    if not filepath or not Path(filepath).exists():
        return jsonify({"error": "文件不存在"}), 404

    filename = task.get("filename", "video.mp4")
    # 根据扩展名判断 MIME 类型
    ext = Path(filename).suffix.lower()
    mime = "audio/mpeg" if ext == ".mp3" else "video/mp4"

    return send_file(
        filepath,
        as_attachment=True,
        download_name=filename,
        mimetype=mime,
    )


# ─── 入口 ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    ip   = get_local_ip()
    port = 5000
    print("=" * 52)
    print("  🎬  YouTube 视频下载 Web 服务")
    print("=" * 52)
    print(f"  本机访问 → http://localhost:{port}")
    print(f"  手机访问 → http://{ip}:{port}")
    print("  ( 手机与电脑需连接同一 Wi-Fi )")
    print("=" * 52)
    print("  画质说明: 最高画质需安装 ffmpeg")
    print("  按 Ctrl+C 停止服务\n")
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
