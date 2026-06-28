FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install -g @anthropic-ai/claude-code

COPY . .

EXPOSE 3000