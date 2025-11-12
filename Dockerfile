# Simbi on Elide - Multi-stage Docker build

# Stage 1: Install Elide
FROM node:20-slim AS elide-install
WORKDIR /tmp
RUN apt-get update && apt-get install -y curl && \
    curl -sSL --tlsv1.2 https://elide.sh | bash -s - --install-rev=1.0.0-beta11-rc1

# Stage 2: Build frontend assets
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 3: Build backend TypeScript
FROM node:20-slim AS backend-build
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm install
COPY backend/ ./backend/
COPY workers/ ./workers/
COPY app.ts ./
RUN npm run build

# Stage 4: Production runtime
FROM node:20-slim AS runtime

# Install Ruby for workers
RUN apt-get update && apt-get install -y \
    ruby \
    ruby-dev \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Ruby gems
WORKDIR /app/workers/ruby
COPY workers/ruby/Gemfile* ./
RUN bundle install

# Install Python packages
WORKDIR /app/workers/python
COPY workers/python/requirements.txt ./
RUN pip3 install -r requirements.txt

# Copy Elide binary
COPY --from=elide-install /root/elide/elide /usr/local/bin/

# Set up application
WORKDIR /app
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY views/ ./views/
COPY workers/ ./workers/
COPY package.json ./

# Create non-root user
RUN useradd -m -u 1000 simbi && chown -R simbi:simbi /app
USER simbi

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start application with Elide
CMD ["elide", "run", "dist/app.js"]
