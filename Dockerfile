FROM oven/bun:1.0.0

# Install dependencies for wkhtmltopdf
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  gnupg \
  wget \
  xfonts-75dpi \
  xfonts-base \
  fontconfig \
  libfreetype6 \
  libjpeg62-turbo \
  libpng16-16 \
  libx11-6 \
  libxcb1 \
  libxext6 \
  libxrender1 \
  ca-certificates \
  xauth \
  xvfb \
  && rm -rf /var/lib/apt/lists/*

# Install wkhtmltopdf with patched Qt
RUN wget -q https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6-1/wkhtmltox_0.12.6-1.buster_amd64.deb && \
  dpkg -i wkhtmltox_0.12.6-1.buster_amd64.deb || true && \
  apt-get update && apt-get -f install -y && \
  dpkg -i wkhtmltox_0.12.6-1.buster_amd64.deb && \
  rm wkhtmltox_0.12.6-1.buster_amd64.deb && \
  rm -rf /var/lib/apt/lists/*

# Create wrapper for wkhtmltopdf with Xvfb
RUN echo '#!/bin/bash\nxvfb-run -a --server-args="-screen 0 1280x1024x24" /usr/local/bin/wkhtmltopdf "$@"' > /usr/local/bin/wkhtmltopdf-xvfb && \
  chmod +x /usr/local/bin/wkhtmltopdf-xvfb

# Test the wkhtmltopdf wrapper works
RUN echo "<html><body><h1>Test</h1></body></html>" | wkhtmltopdf-xvfb - test.pdf && \
  test -f test.pdf && \
  rm test.pdf && \
  echo "wkhtmltopdf test successful"

WORKDIR /app

COPY package*.json ./
RUN bun install

# Copy templates first for better layer caching
COPY templates ./templates/
COPY types ./types/

# Copy the rest of the application
COPY . .

# Make Cloud Run happy by binding to 0.0.0.0
ENV HOST=0.0.0.0
EXPOSE 3000

# Make sure we use the Xvfb wrapper in our application
ENV PATH="/usr/local/bin:${PATH}"

# Set NODE_ENV to production for better performance
ENV NODE_ENV=production

CMD ["bun", "run", "index.ts"]