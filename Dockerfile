FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg fonts-noto-cjk && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Railway 会注入 $PORT 环境变量
ENV PORT=8080

CMD gunicorn -w 1 --threads 8 -b 0.0.0.0:$PORT --timeout 600 app:app
