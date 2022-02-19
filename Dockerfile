FROM node:17-alpine
ENV PORT=8080
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
RUN chown -R nobody: /app
EXPOSE 8080
CMD ["npm", "run", "start"]
