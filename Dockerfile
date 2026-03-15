# We use a Python base image because the AI service has many system-level dependencies for image processing
FROM python:3.9-slim

# Install system dependencies needed for OpenCV, MediaPipe, etc.
RUN apt-get update && apt-get install -y \
    curl \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20.x
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

WORKDIR /app

# -------------------------
# 1. Setup Python AI Service
# -------------------------
COPY ai_service/requirements.txt ./ai_service/
RUN pip install --no-cache-dir -r ai_service/requirements.txt

# -------------------------
# 2. Setup Node.js Server
# -------------------------
COPY server/package.json server/package-lock.json* ./server/
WORKDIR /app/server
RUN npm install

# Copy Prisma schema and generate client before copying the rest of the code
COPY server/prisma ./prisma
RUN npx prisma generate

# -------------------------
# 3. Copy Source Code
# -------------------------
WORKDIR /app
COPY ai_service ./ai_service
COPY server ./server

# Ensure upload directories exist so they can share files
RUN mkdir -p /app/server/uploads/originals /app/server/uploads/masked

# -------------------------
# 4. Create a Startup Script
# -------------------------
# This script starts the Python AI service in the background on port 8000,
# and starts the standard NodeJS server in the foreground, which listens on Render's required PORT.
RUN echo '#!/bin/bash\n\
echo "Starting AI Service on port 8000..."\n\
cd /app/ai_service\n\
uvicorn main:app --host 0.0.0.0 --port 8000 &\n\
\n\
echo "Applying database migrations..."\n\
cd /app/server\n\
npx prisma migrate deploy\n\
node sync_db.js\n\
\n\
echo "Starting Node JS Server..."\n\
cd /app/server\n\
node index.js\n\
' > /app/start.sh && chmod +x /app/start.sh

# Environment variables
ENV NODE_ENV=production
# Force the Node.js server to talk to the local Python AI service
ENV AI_SERVICE_URL=http://localhost:8000

# Start both services
CMD ["/app/start.sh"]
