<<<<<<< HEAD
FROM node:20-alpine AS build
=======
<<<<<<< HEAD
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "dev"]
=======
FROM node:24-alpine AS build
>>>>>>> 84687b719dadb2b8b6fedd94ed53cc87c674f615
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

<<<<<<< HEAD
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
=======
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
>>>>>>> c4fdfa9 (version 3.3.0)
>>>>>>> 84687b719dadb2b8b6fedd94ed53cc87c674f615
