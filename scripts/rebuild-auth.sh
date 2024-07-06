#!/bin/bash

sudo docker rmi auth-service
sudo docker build -t auth-service -f "auth-service/Dockerfile-auth" ./auth-service