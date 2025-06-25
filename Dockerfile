FROM node:20-alpine

# Build frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend ./
RUN npm run build

# Build backend
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install
COPY backend ./backend

# Copy built frontend to final location
COPY --from=0 /app/frontend/dist ./frontend/dist

WORKDIR /app/backend
CMD ["node", "src/index.js"]
EXPOSE 3000
