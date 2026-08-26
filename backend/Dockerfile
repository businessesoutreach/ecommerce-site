FROM node:20-slim

# Install OpenSSL for Prisma and curl for health checks
RUN apt-get update -y && apt-get install -y openssl curl

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port (Fly.io usually expects 8080)
ENV PORT=8080
EXPOSE 8080

# Start the application
CMD [ "npm", "start" ]
