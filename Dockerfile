# -------- Base Node Image --------
FROM node:20-alpine

# -------- Build Frontend --------
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# -------- Build Backend --------
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# -------- Copy Frontend Build into Backend --------
RUN mkdir -p /app/backend/public
RUN cp -r /app/frontend/dist/* /app/backend/public/

# -------- Final Setup --------
WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "src/index.js"]
