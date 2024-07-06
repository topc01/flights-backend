#!/bin/bash

echo "Stop Aplication"
# cd /home/ubuntu/
docker compose --file docker-compose-prod.yml -p back-e1 down