# Utilisez une image de Node.js avec Next.js
FROM node:21 AS frontend

# Définissez le répertoire de travail
WORKDIR /app

# Copiez le fichier package.json et package-lock.json
COPY package*.json ./

# Installez les dépendances
RUN npm install

# Copiez le reste des fichiers
COPY . .

# Construisez l'application Next.js
RUN npm run build

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# Commande par défaut pour démarrer l'application Next.js
CMD ["npm", "run", "dev"]
