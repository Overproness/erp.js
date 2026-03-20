# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Install docker-compose inside the container so our script can use it
RUN apk add --no-cache docker-compose openssl

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Make our script executable inside the container
# RUN chmod +x /app/scripts/launch_n8n.sh

# Your app binds to port 3000, so expose it
EXPOSE 3000

# Define the command to run your app
CMD [ "npm", "start" ]