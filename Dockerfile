# ── deps ─────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── build ────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── runtime ──────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

# ★ output: "standalone" สร้าง .next/standalone ที่มี server.js + node_modules
#   เฉพาะไฟล์ที่ import จริง → ไม่ต้อง copy node_modules ทั้งก้อน
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

USER 10001
EXPOSE 3000
# ★ ไม่ใช่ `npm start` — standalone มี server.js ของตัวเอง
CMD ["node", "server.js"]
