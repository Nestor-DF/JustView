FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expose the vite port
EXPOSE 8080

# Run the dev server and bind to all network interfaces
CMD ["npm", "run", "dev", "--", "--host"]
