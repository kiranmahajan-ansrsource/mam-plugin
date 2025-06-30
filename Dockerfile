FROM node:18

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm ci

COPY frontend ./frontend
RUN cd frontend && npm ci && npm run build

COPY backend ./backend

WORKDIR /app/backend
ENV PORT=8080
CMD ["node", "src/index.js"]
