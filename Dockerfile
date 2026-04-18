# استخدام بيئة رسمية خفيفة مبنية على Node
FROM node:18-bullseye-slim

# تنصيب متصفحات الكروم لتشغيل عملية الرندر وبرنامج ffmpeg للڤيديوهات
RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    libnss3 \
    libxss1 \
    libasound2 \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# نسخ ملفات الحزم
COPY package*.json ./

# تنصيب النسخ الأساسية
RUN npm install

# تأكيد وجود الحزم الاضافية
RUN npm install express cors

# نسخ جميع ملفات المشروع
COPY . .

# المنفذ
EXPOSE 7860

CMD ["node", "render-server.mjs"]
