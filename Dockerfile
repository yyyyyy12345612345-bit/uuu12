FROM node:18-bullseye-slim

RUN apt-get update && \
    apt-get install -y chromium ffmpeg fonts-noto-core --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROMIUM_PATH=/usr/bin/chromium
ENV REMOTION_CHROME_EXECUTABLE=/usr/bin/chromium

WORKDIR /app

# تهيئة مشروع npm جديد وتثبيت الحزم الأساسية فقط لخادم الرندرة لضمان عدم حدوث تداخل
RUN npm init -y && npm install express cors sharp p-queue express-rate-limit

COPY . .

EXPOSE 7860
CMD ["node", "server.js"]
