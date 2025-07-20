FROM oven/bun
ENV NODE_ENV production
COPY --from=node:18 /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
COPY . .
RUN bun install --production
ENV NODE_ENV production
CMD ["bun", "src/index.ts"]
EXPOSE 3000