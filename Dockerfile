FROM node:22-bullseye
WORKDIR /app
COPY package*.json ./
COPY frontend /
RUN npm install --only=production
COPY . .
EXPOSE 6776
CMD ["node", "./server.js"]