FROM oven/bun:1.0.0

# Install dependencies for wkhtmltopdf and wkhtmltox
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  wget \
  xfonts-75dpi \
  xfonts-base \
  fontconfig \
  libjpeg62-turbo \
  libx11-6 \
  libxcb1 \
  libxext6 \
  libxrender1 \
  ca-certificates && \
  wget http://security.debian.org/debian-security/pool/updates/main/o/openssl/libssl1.1_1.1.1n-0+deb10u6_amd64.deb && \
  dpkg -i libssl1.1_1.1.1n-0+deb10u6_amd64.deb && \
  rm libssl1.1_1.1.1n-0+deb10u6_amd64.deb && \
  wget https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6-1/wkhtmltox_0.12.6-1.buster_amd64.deb && \
  dpkg -i wkhtmltox_0.12.6-1.buster_amd64.deb && \
  rm wkhtmltox_0.12.6-1.buster_amd64.deb

WORKDIR /app

COPY package*.json ./
RUN bun install

COPY . .

EXPOSE 3000

CMD ["bun","run", "index.ts"]
