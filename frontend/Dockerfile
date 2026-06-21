# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Set API URL to empty so requests go to same origin (proxied by nginx)
ENV VITE_API_URL=""

RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy custom nginx config for SPA routing & API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
