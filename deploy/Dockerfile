FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends poppler-utils ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY web/ /app/
ENV HOST=0.0.0.0 PORT=8790 FAMILYBOARD_DATA_DIR=/data
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 8790
CMD ["node","server.cjs"]
