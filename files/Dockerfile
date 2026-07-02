FROM node:20-slim

# fontconfig ضروري عشان الخطوط تتسجل بالاسم بدل ما نضمّنها base64 في كل فريم
# ffmpeg/ffprobe ضروريين لدمج الصوت والفيديو
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    fontconfig \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=7860

EXPOSE 7860

# مستخدم غير root — ممارسة أمان أساسية
RUN useradd -m appuser && chown -R appuser /app
USER appuser

CMD ["node", "server.js"]
