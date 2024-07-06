#!/bin/bash

echo "Aplication starting"
# cd /home/ubuntu/
docker compose --file docker-compose-prod.yml -p back-e1 up -d