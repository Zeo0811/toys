#!/usr/bin/env python3
"""
网页移动端长截图工具

运行方式:
    python webpage_screenshot.py

然后在浏览器输入屏幕显示的地址即可访问
"""

import io
import json
import os
import socket
import subprocess
import sys
import tempfile
import threading
import time
import uuid
from pathlib import Path


def ensure_deps() -> None:
    """自动安装所需依赖"""
    missing = []
    for package, import_name in [("flask", "flask"), ("playwright", "playwright")]:
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
        print("依赖安装完成")

    # 确保 Chromium 已安装
    try:
        result = subprocess.run(
            [sys.executable, "-m", "playwright", "install", "--dry-run", "chromium"],
            capture_output=True, text=True
        )
        if "chromium" in result.stdout.lower() or result.returncode != 0:
            raise Exception("需要安装")
    except Exception:
        pass
    print("正在检查/安装 Chromium 浏览器（首次运行可能需要几分钟）...")
    subprocess.check_call(
        [sys.executable, "-m", "playwright", "install", "chromium"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print("Chromium 就绪\n")


ensure_deps()

from flask import Flask, jsonify, request, send_file, Response  # noqa: E402

app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False

# 截图任务存储（内存中）
tasks: dict[str, dict] = {}

SCREENSHOT_DIR = Path(tempfile.mkdtemp(prefix="web_shot_"))

# 设备预设
DEVICES = {
    "iphone12": {
        "label": "iPhone 12/13",
        "width": 390,
        "height": 844,
        "device_scale_factor": 3,
        "user_agent": (
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) "
            "Version/16.0 Mobile/15E148 Safari/604.1"
        ),
    },
    "iphonese": {
        "label": "iPhone SE",
        "width": 375,
        "height": 667,
        "device_scale_factor": 2,
        "user_agent": (
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) "
            "Version/16.0 Mobile/15E148 Safari/604.1"
        ),
    },
    "pixel7": {
        "label": "Pixel 7",
        "width": 412,
        "height": 915,
        "device_scale_factor": 2.625,
        "user_agent": (
            "Mozilla/5.0 (Linux; Android 13; Pixel 7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/116.0.0.0 Mobile Safari/537.36"
        ),
    },
    "ipad": {
        "label": "iPad Mini",
        "width": 768,
        "height": 1024,
        "device_scale_factor": 2,
        "user_agent": (
            "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) "
            "Version/16.0 Mobile/15E148 Safari/604.1"
        ),
    },
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


def run_screenshot(task_id: str, url: str, device_key: str) -> None:
    """后台截图线程"""
    from playwright.sync_api import sync_playwright  # noqa: PLC0415

    task = tasks[task_id]
    device = DEVICES.get(device_key, DEVICES["iphone12"])

    try:
        task["status"] = "launching"
        with sync_playwright() as p:
            browser = p.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
            context = browser.new_context(
                viewport={"width": device["width"], "height": device["height"]},
                device_scale_factor=device["device_scale_factor"],
                is_mobile=True,
                has_touch=True,
                user_agent=device["user_agent"],
            )
            page = context.new_page()
            task["status"] = "loading"
            page.goto(url, wait_until="networkidle", timeout=45_000)
            # 等待懒加载图片等
            page.wait_for_timeout(1500)
            task["status"] = "capturing"
            screenshot_bytes = page.screenshot(full_page=True, type="png")
            browser.close()

        out_path = SCREENSHOT_DIR / f"{task_id}.png"
        out_path.write_bytes(screenshot_bytes)
        task.update({
            "status": "done",
            "filepath": str(out_path),
            "size": len(screenshot_bytes),
        })
    except Exception as exc:
        task.update({"status": "error", "error": str(exc)})


# ─── HTML 前端页面 ──────────────────────────────────────────────────────────────

_DEVICES_JSON = json.dumps(
    {k: v["label"] for k, v in DEVICES.items()}, ensure_ascii=False
)

HTML_PAGE = """\
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#0d1520">
<title>移动端网页截图</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  background:linear-gradient(160deg,#0d1520 0%,#152035 60%,#0a1018 100%);
  min-height:100vh;color:#fff;padding:16px;
}
.wrap{max-width:480px;margin:0 auto;padding-top:28px}

/* 头部 */
header{text-align:center;margin-bottom:24px}
.logo{font-size:44px;line-height:1;margin-bottom:8px}
h1{font-size:22px;font-weight:700;letter-spacing:-.3px}
.sub{font-size:13px;color:rgba(255,255,255,.4);margin-top:4px}

/* 卡片 */
.card{
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.08);
  border-radius:20px;padding:20px;margin-bottom:12px;
}

/* URL 输入 */
.url-row{display:flex;gap:8px;margin-bottom:16px}
.url-input{
  flex:1;min-width:0;
  background:rgba(255,255,255,.07);
  border:1.5px solid rgba(255,255,255,.12);
  border-radius:12px;padding:13px 14px;
  color:#fff;font-size:14px;outline:none;
  transition:border-color .2s;
}
.url-input::placeholder{color:rgba(255,255,255,.28)}
.url-input:focus{border-color:#2979ff}
.paste-btn{
  flex-shrink:0;
  background:rgba(41,121,255,.14);
  border:1.5px solid rgba(41,121,255,.28);
  border-radius:12px;padding:13px 15px;
  color:#64b5f6;font-size:13px;font-weight:600;
  cursor:pointer;white-space:nowrap;transition:background .2s;
}
.paste-btn:active{background:rgba(41,121,255,.28)}

/* 设备选择 */
.sec-label{
  font-size:11px;color:rgba(255,255,255,.4);
  text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;
}
.dev-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px}
.dev-btn{
  background:rgba(255,255,255,.07);
  border:1.5px solid rgba(255,255,255,.12);
  border-radius:20px;padding:7px 15px;
  color:rgba(255,255,255,.65);font-size:13px;
  cursor:pointer;transition:all .15s;
}
.dev-btn.active{
  background:linear-gradient(135deg,#1565c0,#2979ff);
  border-color:transparent;color:#fff;font-weight:600;
}

/* 截图按钮 */
.shot-btn{
  width:100%;padding:15px;
  background:linear-gradient(135deg,#1565c0,#2979ff);
  border:none;border-radius:14px;color:#fff;
  font-size:16px;font-weight:700;cursor:pointer;
  transition:opacity .2s,transform .1s;letter-spacing:.3px;
}
.shot-btn:active{transform:scale(.97)}
.shot-btn:disabled{opacity:.38;cursor:not-allowed;transform:none}

/* 错误 */
.err{
  display:none;margin-top:12px;padding:10px 13px;
  background:rgba(255,80,80,.1);
  border:1px solid rgba(255,80,80,.25);
  border-radius:10px;font-size:13px;color:#ff8080;line-height:1.5;
}
.err.show{display:block}

/* 进度 */
.prog-wrap{display:none;margin-top:18px;text-align:center}
.prog-wrap.show{display:block}
.spinner-lg{
  width:48px;height:48px;margin:0 auto 14px;
  border:3px solid rgba(255,255,255,.1);
  border-top-color:#2979ff;border-radius:50%;
  animation:spin .8s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}
.prog-status{font-size:15px;color:rgba(255,255,255,.75);margin-bottom:4px}
.prog-hint{font-size:12px;color:rgba(255,255,255,.3)}

/* 完成预览 */
.result-wrap{display:none;margin-top:16px}
.result-wrap.show{display:block}
.preview-box{
  border-radius:12px;overflow:hidden;
  border:1px solid rgba(255,255,255,.1);
  margin-bottom:14px;max-height:340px;overflow-y:auto;
  background:rgba(0,0,0,.2);
}
.preview-img{width:100%;display:block}
.save-btn{
  display:block;width:100%;padding:15px;
  background:linear-gradient(135deg,#00897b,#00bfa5);
  border:none;border-radius:14px;color:#fff;
  font-size:16px;font-weight:700;
  text-align:center;text-decoration:none;
  cursor:pointer;transition:opacity .2s;
}
.save-btn:active{opacity:.82}
.img-meta{
  text-align:center;font-size:12px;
  color:rgba(255,255,255,.3);margin-bottom:10px;
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
    <div class="logo">📱</div>
    <h1>移动端网页长截图</h1>
    <p class="sub">输入网址，一键截取完整移动端页面</p>
  </header>

  <div class="card">

    <!-- URL 输入 -->
    <div class="url-row">
      <input type="url" id="urlInput" class="url-input"
             placeholder="输入网页地址，如 https://example.com"
             autocomplete="off" autocorrect="off"
             autocapitalize="none" spellcheck="false">
      <button class="paste-btn" onclick="pasteUrl()">粘贴</button>
    </div>

    <!-- 设备选择 -->
    <div class="sec-label">选择设备</div>
    <div class="dev-row" id="devRow"></div>

    <!-- 截图按钮 -->
    <button class="shot-btn" id="shotBtn" onclick="startShot()">📷&nbsp; 开始截图</button>

    <!-- 错误 -->
    <div class="err" id="errMsg"></div>

    <!-- 进度 -->
    <div class="prog-wrap" id="progWrap">
      <div class="spinner-lg"></div>
      <div class="prog-status" id="progStatus">正在启动浏览器...</div>
      <div class="prog-hint">完整页面截图可能需要 10~30 秒</div>
    </div>

    <!-- 结果 -->
    <div class="result-wrap" id="resultWrap">
      <div class="img-meta" id="imgMeta"></div>
      <div class="preview-box">
        <img class="preview-img" id="previewImg" src="" alt="截图预览">
      </div>
      <a class="save-btn" id="saveLink" href="#" download="screenshot.png">
        ⬇&nbsp; 保存截图到本地
      </a>
    </div>

  </div>

  <footer>
    使用 Playwright + Chromium 渲染页面<br>
    截图以移动端视口尺寸拍摄完整页面长图
  </footer>

</div>

<script>
var DEVICES = """ + _DEVICES_JSON + """;
var selectedDevice = 'iphone12';
var pollTimer = null;

/* ── 渲染设备按钮 ── */
(function buildDevBtns() {
  var row = document.getElementById('devRow');
  Object.keys(DEVICES).forEach(function(key) {
    var btn = document.createElement('button');
    btn.className = 'dev-btn' + (key === selectedDevice ? ' active' : '');
    btn.dataset.dev = key;
    btn.textContent = DEVICES[key];
    row.appendChild(btn);
  });
  row.addEventListener('click', function(e) {
    var btn = e.target.closest('.dev-btn');
    if (!btn) return;
    document.querySelectorAll('.dev-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    selectedDevice = btn.dataset.dev;
  });
})();

/* ── 粘贴 ── */
async function pasteUrl() {
  try {
    var text = await navigator.clipboard.readText();
    document.getElementById('urlInput').value = text;
  } catch(e) {
    var inp = document.getElementById('urlInput');
    inp.focus();
    inp.select();
  }
}

/* ── 开始截图 ── */
async function startShot() {
  var url = document.getElementById('urlInput').value.trim();
  if (!url) { showErr('请输入网页地址'); return; }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
    document.getElementById('urlInput').value = url;
  }

  showErr('');
  document.getElementById('resultWrap').classList.remove('show');
  document.getElementById('progWrap').classList.add('show');
  document.getElementById('shotBtn').disabled = true;
  setStatus('正在启动浏览器...');
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }

  try {
    var res = await fetch('/api/screenshot/start', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({url: url, device: selectedDevice})
    });
    var d = await res.json();
    if (d.error) { showErr(d.error); resetBtn(); return; }
    pollStatus(d.task_id);
  } catch(e) {
    showErr('网络错误，请重试');
    resetBtn();
  }
}

/* ── 轮询状态 ── */
function pollStatus(taskId) {
  var statusMap = {
    pending:    '排队中...',
    launching:  '启动浏览器中...',
    loading:    '加载页面中...',
    capturing:  '正在截图...',
  };
  pollTimer = setInterval(async function() {
    try {
      var res = await fetch('/api/screenshot/status/' + taskId);
      var d = await res.json();
      if (d.status in statusMap) {
        setStatus(statusMap[d.status]);
      } else if (d.status === 'done') {
        clearInterval(pollTimer);
        showResult(taskId, d.size);
        resetBtn();
      } else if (d.status === 'error') {
        clearInterval(pollTimer);
        showErr(d.error || '截图失败，请检查网址是否正确');
        resetBtn();
      }
    } catch(e) {
      clearInterval(pollTimer);
      showErr('查询状态失败，请重试');
      resetBtn();
    }
  }, 800);
}

function setStatus(msg) {
  document.getElementById('progStatus').textContent = msg;
}

function showResult(taskId, size) {
  document.getElementById('progWrap').classList.remove('show');
  var url = '/api/screenshot/file/' + taskId;
  document.getElementById('previewImg').src = url + '?t=' + Date.now();
  document.getElementById('saveLink').href = url;
  var kb = size ? ' · ' + Math.round(size / 1024) + ' KB' : '';
  document.getElementById('imgMeta').textContent = '截图完成' + kb;
  document.getElementById('resultWrap').classList.add('show');
}

function showErr(msg) {
  document.getElementById('progWrap').classList.remove('show');
  var el = document.getElementById('errMsg');
  el.textContent = msg;
  el.classList.toggle('show', !!msg);
}

function resetBtn() {
  document.getElementById('shotBtn').disabled = false;
}
</script>
</body>
</html>
"""


# ─── API 路由 ──────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return HTML_PAGE, 200, {"Content-Type": "text/html; charset=utf-8"}


@app.route("/api/screenshot/start", methods=["POST"])
def api_start():
    data = request.json or {}
    url = data.get("url", "").strip()
    device = data.get("device", "iphone12")
    if not url:
        return jsonify({"error": "请输入网页地址"}), 400
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    if device not in DEVICES:
        device = "iphone12"

    task_id = str(uuid.uuid4())
    tasks[task_id] = {
        "status": "pending",
        "error": "",
        "filepath": "",
        "size": 0,
    }
    thread = threading.Thread(
        target=run_screenshot, args=(task_id, url, device), daemon=True
    )
    thread.start()
    return jsonify({"task_id": task_id})


@app.route("/api/screenshot/status/<task_id>")
def api_status(task_id: str):
    task = tasks.get(task_id)
    if task is None:
        return jsonify({"status": "error", "error": "任务不存在"}), 404
    return jsonify({k: v for k, v in task.items() if k != "filepath"})


@app.route("/api/screenshot/file/<task_id>")
def api_file(task_id: str):
    task = tasks.get(task_id, {})
    if task.get("status") != "done":
        return jsonify({"error": "截图未完成"}), 404
    filepath = task.get("filepath", "")
    if not filepath or not Path(filepath).exists():
        return jsonify({"error": "文件不存在"}), 404
    return send_file(
        filepath,
        mimetype="image/png",
        as_attachment=True,
        download_name="screenshot.png",
    )


# ─── 入口 ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    ip = get_local_ip()
    port = 5001
    print("=" * 52)
    print("  📱  移动端网页长截图工具")
    print("=" * 52)
    print(f"  本机访问 → http://localhost:{port}")
    print(f"  手机访问 → http://{ip}:{port}")
    print("  ( 手机与电脑需连接同一 Wi-Fi )")
    print("=" * 52)
    print("  支持设备: iPhone 12/13, iPhone SE, Pixel 7, iPad Mini")
    print("  按 Ctrl+C 停止服务\n")
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
