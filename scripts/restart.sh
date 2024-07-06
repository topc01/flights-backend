#!/bin/bash

# if [ -z "$1" ]; then
#   echo "Please specify the environment (dev or prod)."
#   exit 1
# fi

# if [ "$1" == "dev" ]; then
#   export $(grep -v '^#' .env.dev | xargs)
#   ENV_FILE=".env.dev"
# elif [ "$1" == "prod" ]; then
#   export $(grep -v '^#' .env.prod | xargs)
#   ENV_FILE=".env.prod"
# else
#   echo "Invalid environment specified. Use 'dev' or 'prod'."
#   exit 1
# fi

# sudo docker-compose --env-file $ENV_FILE down
sudo docker compose down
git pull
bash scripts/imagenator.sh
# sudo docker-compose --env-file $ENV_FILE up -d
sudo docker compose up -d
sudo docker compose logs -f
