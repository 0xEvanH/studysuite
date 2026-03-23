FROM oven/bun:1 AS builder

WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

COPY . .

ARG VITE_PB_URL
ENV VITE_PB_URL=$VITE_PB_URL

RUN bunx vite build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
