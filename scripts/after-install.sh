#!/bin/bash

echo "Pulling aplication"
# cd /home/ubuntu/
docker compose --file docker-compose-prod.yml -p back-e1 pull
