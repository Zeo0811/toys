"""
video_client.py — 视频下载服务的 Python 客户端，供 agent 或脚本调用

用法:
    from video_client import VideoClient

    client = VideoClient("https://your-app.railway.app")
    job_id = client.download("https://youtube.com/watch?v=xxx", quality="720p")
    client.wait(job_id)
    client.save(job_id, "video.mp4")
"""

import os
import time
import json
import urllib.request
import urllib.error
from pathlib import Path
from http.cookiejar import CookieJar

DEFAULT_SERVER = os.environ.get("VIDEO_SERVER", "http://localhost:5000")


class VideoClient:
    """
    视频下载服务客户端。

    自动管理 cookie（用于服务端用户隔离），无需认证。
    线程安全：每个实例持有独立 session。
    """

    def __init__(self, server: str = DEFAULT_SERVER):
        self.server = server.rstrip("/")
        self._jar = CookieJar()
        self._opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self._jar)
        )

    # ── 内部 HTTP 工具 ────────────────────────────────────

    def _post(self, path: str, data: dict) -> dict:
        url = self.server + path
        body = json.dumps(data).encode()
        req = urllib.request.Request(
            url, data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with self._opener.open(req, timeout=30) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            return json.loads(e.read())

    def _get(self, path: str) -> dict:
        url = self.server + path
        req = urllib.request.Request(url)
        with self._opener.open(req, timeout=30) as r:
            return json.loads(r.read())

    # ── 公开接口 ──────────────────────────────────────────

    def info(self, url: str) -> dict:
        """
        获取视频基本信息（标题、缩略图、时长）。

        返回:
            {"title": str, "thumbnail": str, "duration": str, "uploader": str}
        """
        resp = self._post("/api/info", {"url": url})
        if "error" in resp:
            raise RuntimeError(resp["error"])
        return resp

    def download(self, url: str, quality: str = "best") -> str:
        """
        提交下载任务，立即返回 job_id（异步）。

        quality: best | 1080p | 720p | 480p | audio
        """
        resp = self._post("/api/download", {"url": url, "quality": quality})
        if "error" in resp:
            raise RuntimeError(resp["error"])
        return resp["job_id"]

    def status(self, job_id: str) -> dict:
        """查询任务当前状态，返回完整 job 字典。"""
        resp = self._get(f"/api/job/{job_id}")
        if "error" in resp:
            raise RuntimeError(resp["error"])
        return resp

    def wait(self, job_id: str, poll_interval: float = 2.0, timeout: float = 3600) -> dict:
        """
        阻塞等待任务完成，返回最终 job 字典。

        Raises:
            RuntimeError: 下载失败或超时
        """
        deadline = time.time() + timeout
        while time.time() < deadline:
            job = self.status(job_id)
            s = job.get("status")
            if s == "done":
                return job
            if s == "error":
                raise RuntimeError(f"下载失败: {job.get('error')}")
            time.sleep(poll_interval)
        raise TimeoutError(f"等待超时（{timeout}s）")

    def save(self, job_id: str, dest: str | Path, file_type: str = "original") -> Path:
        """
        将服务器上的文件下载到本地。

        file_type: "original"（原视频）或 "burned"（含烧录字幕版）
        dest: 目标路径（文件或目录均可）
        """
        dest = Path(dest)
        # 若 dest 是目录，自动取服务器文件名
        if dest.is_dir() or not dest.suffix:
            job = self.status(job_id)
            key = "burned_filename" if file_type == "burned" else "original_filename"
            filename = job.get(key) or job.get("filename") or "video.mp4"
            dest = dest / filename

        dest.parent.mkdir(parents=True, exist_ok=True)
        url = f"{self.server}/api/file/{job_id}/{file_type}"
        req = urllib.request.Request(url)
        with self._opener.open(req, timeout=300) as r, open(dest, "wb") as f:
            while chunk := r.read(65536):
                f.write(chunk)
        return dest

    def burn(self, job_id: str) -> None:
        """触发字幕翻译烧录（异步，用 wait_burn 等待完成）。"""
        resp = self._post(f"/api/burn/{job_id}", {})
        if not resp.get("ok"):
            raise RuntimeError(resp.get("error", "触发烧录失败"))

    def wait_burn(self, job_id: str, poll_interval: float = 3.0, timeout: float = 3600) -> dict:
        """阻塞等待字幕烧录完成，返回最终 job 字典。"""
        deadline = time.time() + timeout
        while time.time() < deadline:
            job = self.status(job_id)
            bs = job.get("burn_status", "idle")
            if bs == "done":
                return job
            if bs == "error":
                raise RuntimeError(f"烧录失败: {job.get('burn_error')}")
            time.sleep(poll_interval)
        raise TimeoutError(f"烧录等待超时（{timeout}s）")

    # ── 便捷一体化方法 ────────────────────────────────────

    def download_and_save(
        self,
        url: str,
        dest: str | Path = ".",
        quality: str = "best",
        with_subtitle: bool = False,
    ) -> Path:
        """
        一步完成：提交下载 → 等待完成 → 保存到本地。

        with_subtitle=True 时额外触发字幕烧录并保存烧录版。
        返回保存的本地文件路径。
        """
        job_id = self.download(url, quality)
        self.wait(job_id)

        if with_subtitle:
            self.burn(job_id)
            self.wait_burn(job_id)
            return self.save(job_id, dest, file_type="burned")

        return self.save(job_id, dest)


# ── 命令行快速测试 ────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("用法: python video_client.py <视频URL> [quality] [输出目录]")
        sys.exit(1)

    url = sys.argv[1]
    quality = sys.argv[2] if len(sys.argv) > 2 else "best"
    output = sys.argv[3] if len(sys.argv) > 3 else "."
    server = os.environ.get("VIDEO_SERVER", "http://localhost:5000")

    client = VideoClient(server)
    print(f"提交下载: {url}")
    saved = client.download_and_save(url, output, quality)
    print(f"已保存: {saved}")
