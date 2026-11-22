FROM node:22-alpine

# Install OpenSSL for Prisma engine & curl
RUN apk add --no-cache openssl libc6-compat curl

WORKDIR /app

# Copy package definitions
COPY package*.json ./

# Install dependencies
RUN npm ci || npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application files
COPY . .

# Default port (Vercel, Fly.io, Railway, Cloud Run inject $PORT)
ENV PORT=8000
EXPOSE 8000

# Start the application
CMD [ "npm", "start" ]
