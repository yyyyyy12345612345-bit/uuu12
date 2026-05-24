FROM node:20-slim

RUN apt-get update && apt-get install -y \
    wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

COPY --chown=user package.json .
RUN npm install

COPY --chown=user index.js .

EXPOSE 7860
CMD ["node", "index.js"]
