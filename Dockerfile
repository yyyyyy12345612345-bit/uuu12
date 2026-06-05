FROM node:18-bullseye-slim

RUN apt-get update && \
    apt-get install -y chromium ffmpeg fonts-noto-core --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROMIUM_PATH=/usr/bin/chromium
ENV REMOTION_CHROME_EXECUTABLE=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install express cors sharp

COPY . .

EXPOSE 7860
CMD ["node", "render-server.mjs"]
