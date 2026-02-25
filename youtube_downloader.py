#!/usr/bin/env python3
"""
YouTube 高清视频下载器
依赖: yt-dlp (pip install yt-dlp)
可选: ffmpeg (用于合并最高画质音视频流)
"""

import sys
import os
import subprocess


def check_dependencies():
    """检查必要依赖是否已安装"""
    try:
        import yt_dlp
    except ImportError:
        print("未检测到 yt-dlp，正在自动安装...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "yt-dlp"])
        print("yt-dlp 安装完成\n")


def get_available_formats(url: str) -> None:
    """列出视频所有可用格式"""
    import yt_dlp

    ydl_opts = {"listformats": True, "quiet": False}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.extract_info(url, download=False)


def download_video(url: str, output_dir: str = ".", quality: str = "best") -> None:
    """
    下载 YouTube 视频

    参数:
        url:        YouTube 视频链接
        output_dir: 输出目录（默认当前目录）
        quality:    画质选项
                    'best'   - 最高画质（需要 ffmpeg 合并）
                    '1080p'  - 1080p
                    '720p'   - 720p
                    '480p'   - 480p
                    'audio'  - 仅音频 (mp3)
    """
    import yt_dlp

    os.makedirs(output_dir, exist_ok=True)

    # 格式选择策略
    format_map = {
        "best":  "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best",
        "1080p": "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]",
        "720p":  "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]",
        "480p":  "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480]",
        "audio": "bestaudio/best",
    }

    fmt = format_map.get(quality, format_map["best"])

    ydl_opts: dict = {
        "format": fmt,
        "outtmpl": os.path.join(output_dir, "%(title)s.%(ext)s"),
        "merge_output_format": "mp4",
        "noplaylist": True,   # 只下载单个视频，不下载整个播放列表
        "progress_hooks": [progress_hook],
        "postprocessors": [],
    }

    # 仅音频时转换为 mp3
    if quality == "audio":
        ydl_opts["postprocessors"].append(
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }
        )
        ydl_opts["outtmpl"] = os.path.join(output_dir, "%(title)s.%(ext)s")

    print(f"\n开始下载: {url}")
    print(f"画质: {quality}  |  保存到: {os.path.abspath(output_dir)}\n")

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        title = info.get("title", "未知标题")
        print(f"\n下载完成: 《{title}》")


def progress_hook(d: dict) -> None:
    """显示下载进度"""
    if d["status"] == "downloading":
        percent = d.get("_percent_str", "N/A").strip()
        speed = d.get("_speed_str", "N/A").strip()
        eta = d.get("_eta_str", "N/A").strip()
        print(f"\r进度: {percent}  速度: {speed}  剩余时间: {eta}  ", end="", flush=True)
    elif d["status"] == "finished":
        print(f"\n文件已下载: {d['filename']}")


def interactive_mode() -> None:
    """交互式命令行界面"""
    print("=" * 50)
    print("   YouTube 高清视频下载器")
    print("=" * 50)

    url = input("\n请输入 YouTube 视频链接: ").strip()
    if not url:
        print("错误: 链接不能为空")
        sys.exit(1)

    print("\n画质选项:")
    print("  1. best   - 最高画质（推荐，需要 ffmpeg）")
    print("  2. 1080p  - 1080p 高清")
    print("  3. 720p   - 720p 高清")
    print("  4. 480p   - 480p 标清")
    print("  5. audio  - 仅音频 (mp3)")

    choice_map = {"1": "best", "2": "1080p", "3": "720p", "4": "480p", "5": "audio"}
    choice = input("\n请选择画质 [1-5，默认 1]: ").strip() or "1"
    quality = choice_map.get(choice, "best")

    output_dir = input("保存目录 [默认: 当前目录]: ").strip() or "."

    download_video(url, output_dir, quality)


def main() -> None:
    check_dependencies()

    args = sys.argv[1:]

    if not args:
        # 无参数 → 交互模式
        interactive_mode()
        return

    # 命令行参数模式
    # 用法: python youtube_downloader.py <url> [quality] [output_dir]
    url = args[0]

    if url in ("-h", "--help"):
        print(__doc__)
        print("用法: python youtube_downloader.py <YouTube链接> [画质] [保存目录]")
        print("      画质选项: best | 1080p | 720p | 480p | audio")
        print("示例: python youtube_downloader.py https://youtu.be/xxxx 1080p ~/Downloads")
        return

    if url in ("-l", "--list-formats") and len(args) >= 2:
        get_available_formats(args[1])
        return

    quality = args[1] if len(args) > 1 else "best"
    output_dir = args[2] if len(args) > 2 else "."

    download_video(url, output_dir, quality)


if __name__ == "__main__":
    main()
