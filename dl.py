#!/usr/bin/env python3
"""
dl.py  —  视频下载 Web 服务的 CLI 客户端

通过 HTTP API 与 app.py 交互，支持实时进度显示和文件下载。

用法:
    python dl.py <视频链接> [选项]

选项:
    -q, --quality  best|1080p|720p|480p|audio  (默认 best)
    -o, --output   保存目录 (默认 ./downloads_cli/)
    -s, --server   Web 服务地址 (默认 http://localhost:5000)
    -h, --help

示例:
    python dl.py https://youtu.be/xxxx
    python dl.py https://youtu.be/xxxx -q 1080p -o ~/Downloads
    python dl.py https://youtu.be/xxxx -s https://my-app.onrender.com
"""

import sys
import os
import json
import time
import argparse
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path

DEFAULT_SERVER = os.environ.get("DL_SERVER", "http://localhost:5000")
DEFAULT_OUTPUT = Path("downloads_cli")

STATUS_LABEL = {
    "pending":     "准备中...",
    "queued":      "排队中",
    "downloading": "下载中",
    "merging":     "合并中",
    "translating": "翻译字幕",
    "burning":     "烧录字幕",
    "done":        "完成",
    "error":       "失败",
}


# ── 轻量 HTTP 工具（无第三方依赖）──────────────────────────

def _post(server: str, path: str, data: dict | None = None, files: dict | None = None) -> dict:
    url = server.rstrip("/") + path
    if files:
        # multipart/form-data
        boundary = "----Boundary" + str(int(time.time()))
        body_parts = []
        for name, (fname, fbytes) in files.items():
            body_parts.append(
                f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; '
                f'filename="{fname}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode()
                + fbytes + b"\r\n"
            )
        body = b"".join(body_parts) + f"--{boundary}--\r\n".encode()
        headers = {"Content-Type": f"multipart/form-data; boundary={boundary}"}
    else:
        body = json.dumps(data or {}).encode()
        headers = {"Content-Type": "application/json"}

    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())


def _get(server: str, path: str) -> dict:
    url = server.rstrip("/") + path
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def _stream_sse(server: str, path: str):
    """迭代 SSE 事件，每次 yield 一个解析后的 dict。"""
    url = server.rstrip("/") + path
    req = urllib.request.Request(url, headers={"Accept": "text/event-stream"})
    with urllib.request.urlopen(req, timeout=120) as r:
        for raw in r:
            line = raw.decode(errors="replace").rstrip("\n")
            if line.startswith("data:"):
                try:
                    yield json.loads(line[5:].strip())
                except json.JSONDecodeError:
                    pass


def _download_file(server: str, path: str, dest: Path) -> None:
    url = server.rstrip("/") + path
    dest.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=300) as r:
        total = int(r.headers.get("Content-Length", 0))
        done = 0
        with open(dest, "wb") as f:
            while True:
                chunk = r.read(65536)
                if not chunk:
                    break
                f.write(chunk)
                done += len(chunk)
                if total:
                    pct = done * 100 // total
                    bar = "█" * (pct // 5) + "░" * (20 - pct // 5)
                    print(f"\r  [{bar}] {pct:3d}%  {done/1024/1024:.1f}/{total/1024/1024:.1f} MB  ", end="", flush=True)
    print()


# ── 进度条渲染 ─────────────────────────────────────────────

def _bar(pct: float, width: int = 25) -> str:
    filled = int(pct / 100 * width)
    return "█" * filled + "░" * (width - filled)


def _print_progress(job: dict) -> None:
    status = job.get("status", "")
    label  = STATUS_LABEL.get(status, status)
    pct    = job.get("progress", 0)
    speed  = job.get("speed", "")
    eta    = job.get("eta", "")
    qpos   = job.get("queue_pos", 0)

    if status in ("queued", "pending"):
        q = f"  前方 {qpos} 个任务" if qpos > 0 else ""
        print(f"\r  ⏳ {label}{q}                          ", end="", flush=True)
    elif status in ("downloading",):
        extra = f"  {speed}" if speed else ""
        extra += f"  剩余 {eta}" if eta else ""
        print(f"\r  [{_bar(pct)}] {pct:5.1f}%{extra}  ", end="", flush=True)
    elif status in ("merging", "translating", "burning"):
        extra = f" {pct}%" if pct else ""
        print(f"\r  ⏳ {label}{extra}...                   ", end="", flush=True)


# ── 主流程 ────────────────────────────────────────────────

def cmd_download(server: str, url: str, quality: str, output_dir: Path) -> None:
    print(f"\n🔗 {url}")
    print(f"📶 画质: {quality}  |  服务: {server}\n")

    # 1. 提交下载任务
    resp = _post(server, "/api/download", {"url": url, "quality": quality})
    if "error" in resp:
        print(f"❌ 提交失败: {resp['error']}")
        sys.exit(1)

    job_id = resp["job_id"]
    print(f"  任务 ID: {job_id}")

    # 2. 订阅 SSE 进度
    try:
        for job in _stream_sse(server, f"/api/progress/{job_id}"):
            _print_progress(job)
            if job.get("status") == "done":
                print(f"\n\n✅ 《{job.get('title', '')}》下载完成")
                break
            if job.get("status") == "error":
                print(f"\n\n❌ 下载失败: {job.get('error', '')}")
                sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️  已中断（任务仍在服务器后台运行）")
        print(f"  稍后可用以下命令检查状态：")
        print(f"  python dl.py status {job_id} -s {server}")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ SSE 断开: {e}")
        sys.exit(1)

    # 3. 取回文件信息并保存到本地
    job_info = _get(server, f"/api/job/{job_id}")
    filename = job_info.get("original_filename") or job_info.get("filename") or "video.mp4"
    dest = output_dir / filename
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n⬇️  正在保存到: {dest}")
    try:
        _download_file(server, f"/api/file/{job_id}/original", dest)
        print(f"✅ 已保存: {dest.resolve()}")
    except Exception as e:
        print(f"❌ 保存失败: {e}")
        print(f"   也可以在浏览器打开: {server}/api/file/{job_id}/original")


def cmd_status(server: str, job_id: str) -> None:
    try:
        job = _get(server, f"/api/job/{job_id}")
        if "error" in job:
            print(f"❌ {job['error']}")
            return
        status = job.get("status", "unknown")
        label  = STATUS_LABEL.get(status, status)
        title  = job.get("title", "")
        print(f"  状态: {label}  ({status})")
        if title:
            print(f"  标题: {title}")
        if status == "downloading":
            print(f"  进度: {job.get('progress', 0):.1f}%  速度: {job.get('speed', '')}  剩余: {job.get('eta', '')}")
        if job.get("error"):
            print(f"  错误: {job['error']}")
    except Exception as e:
        print(f"❌ 无法连接服务: {e}")


def cmd_history(server: str) -> None:
    try:
        items = _get(server, "/api/history")
        if not items:
            print("  暂无下载历史")
            return
        for item in items:
            status = item.get("status", "")
            icon = "✅" if status == "done" else "❌"
            burned = " [有烧录版]" if item.get("burned_filename") else ""
            print(f"  {icon} {item.get('title') or item.get('filename', '未知')}{burned}")
            print(f"      job_id: {item['job_id']}  |  {item.get('completed_at', '')}")
    except Exception as e:
        print(f"❌ 无法获取历史: {e}")


def cmd_cookies(server: str) -> None:
    try:
        pool = _get(server, "/api/cookies/pool")
        if not pool:
            print("  暂无 Cookie")
            return
        for i, c in enumerate(pool, 1):
            v = c.get("valid")
            badge = "✅ 正常" if v is True else ("❌ 已失效" if v is False else "⚪ 未验证")
            if c.get("checking"):
                badge = "⏳ 检测中"
            cnt = c.get("use_count", 0)
            lu  = c.get("last_used_ago") or "从未"
            print(f"  Cookie {i}  {c['size_kb']} KB  {badge}  {cnt}次 · {lu}")
    except Exception as e:
        print(f"❌ 无法获取 Cookie 池: {e}")


def cmd_check_cookies(server: str) -> None:
    try:
        resp = _post(server, "/api/cookies/check_all")
        n = resp.get("checking", 0)
        if n == 0:
            print("  暂无 Cookie 可检测")
            return
        print(f"  正在后台检测 {n} 个 Cookie，请稍后运行 `python dl.py cookies` 查看结果")
    except Exception as e:
        print(f"❌ 失败: {e}")


def cmd_upload_cookie(server: str, filepath: str) -> None:
    p = Path(filepath)
    if not p.exists():
        print(f"❌ 文件不存在: {p}")
        sys.exit(1)
    resp = _post(server, "/api/cookies/upload", files={"file": (p.name, p.read_bytes())})
    if resp.get("ok"):
        print(f"✅ Cookie 已上传，池中共 {resp['count']} 个")
    else:
        print(f"❌ 上传失败: {resp.get('error', '')}")


# ── CLI 解析 ─────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="视频下载 Web 服务 CLI 客户端",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
子命令:
  <URL>              提交下载任务并保存到本地
  status <job_id>    查询任务状态
  history            显示最近下载历史
  cookies            查看 Cookie 池状态
  check-cookies      触发后台检测所有 Cookie
  upload-cookie <文件> 上传 Cookie 文件

环境变量:
  DL_SERVER          默认服务地址（等同于 -s 选项）

示例:
  python dl.py https://youtu.be/xxxx
  python dl.py https://youtu.be/xxxx -q 1080p -o ~/Downloads
  python dl.py https://youtu.be/xxxx -s https://my-app.onrender.com
  python dl.py history
  python dl.py upload-cookie ~/cookies.txt
        """,
    )

    parser.add_argument("command", nargs="?", help="视频链接 或 子命令")
    parser.add_argument("extra", nargs="*", help="子命令参数")
    parser.add_argument("-q", "--quality", default="best",
                        choices=["best", "1080p", "720p", "480p", "audio"],
                        help="画质 (默认: best)")
    parser.add_argument("-o", "--output", default=str(DEFAULT_OUTPUT),
                        help=f"保存目录 (默认: {DEFAULT_OUTPUT})")
    parser.add_argument("-s", "--server", default=DEFAULT_SERVER,
                        help=f"Web 服务地址 (默认: {DEFAULT_SERVER})")

    args = parser.parse_args()
    server = args.server.rstrip("/")

    if not args.command:
        parser.print_help()
        return

    cmd = args.command

    if cmd in ("history",):
        cmd_history(server)
    elif cmd in ("cookies",):
        cmd_cookies(server)
    elif cmd in ("check-cookies",):
        cmd_check_cookies(server)
    elif cmd in ("status",):
        if not args.extra:
            print("用法: python dl.py status <job_id>")
            sys.exit(1)
        cmd_status(server, args.extra[0])
    elif cmd in ("upload-cookie",):
        if not args.extra:
            print("用法: python dl.py upload-cookie <cookies.txt 路径>")
            sys.exit(1)
        cmd_upload_cookie(server, args.extra[0])
    elif cmd.startswith("http"):
        cmd_download(server, cmd, args.quality, Path(args.output))
    else:
        print(f"未知命令或无效链接: {cmd}")
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
