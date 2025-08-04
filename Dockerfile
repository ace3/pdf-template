# Build stage
FROM golang:1.24-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
  git \
  gcc \
  musl-dev

WORKDIR /app

# Copy go module files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Runtime stage - use Ubuntu for better Chrome/Chromium support
FROM ubuntu:22.04

# Install Chrome and dependencies
RUN apt-get update && apt-get install -y \
  wget \
  gnupg \
  ca-certificates \
  fonts-liberation \
  fonts-dejavu-core \
  fontconfig \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libxss1 \
  libasound2 \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
  && apt-get update \
  && apt-get install -y google-chrome-stable \
  && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/main .

# Copy HTML templates and assets
COPY *.html ./
COPY images/ ./images/

# Create a non-root user with proper home directory setup
RUN groupadd -r appuser && useradd -r -g appuser -m appuser \
  && mkdir -p /home/appuser/.local/share/applications \
  && mkdir -p /home/appuser/.config/google-chrome \
  && mkdir -p /tmp/.X11-unix \
  && chmod 1777 /tmp/.X11-unix \
  && chown -R appuser:appuser /home/appuser \
  && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Set environment variables for Cloud Run
ENV PORT=3000
# TODO: Replace NODE_ENV with a more Go-appropriate variable like GO_ENV or ENV
ENV NODE_ENV=production

# Run the application
CMD ["./main"]
