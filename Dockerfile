# Use an official Node.js runtime as a parent image
FROM bun:1.0

# Install dependencies for Puppeteer (Chromium)
RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install any needed dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Set the environment variable to tell Google Cloud Run what port to listen on
ENV PORT 3000

# Define the command to run the app
CMD ["bun", "index.ts"]
