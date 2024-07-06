#!/bin/bash

# Define the directories where your Dockerfiles are located
dir1="./exp-api"
dir2="./subscriber"
dir3="./auth-service"
dir4="./publisher"
dir5="./worker-service/master"
dir6="./worker-service/worker"

# Define each image name/tag
name1="api"
name2="subscriber"
name3="auth-service"
name4="publisher"
name5="master"
name6="worker"


# Build Docker images from each directory
sudo docker build -t $name1 -f "$dir1/Dockerfile-api" "$dir1"
sudo docker build -t $name2 -f "$dir2/Dockerfile-mqtt" "$dir2"
sudo docker build -t $name3 -f "$dir3/Dockerfile-auth" "$dir3"
sudo docker build -t $name4 -f "$dir4/Dockerfile-pub" "$dir4"
sudo docker build -t $name5 -f "$dir5/Dockerfile-master" "$dir5"
sudo docker build -t $name6 -f "$dir6/Dockerfile-worker" "$dir6"

# REBUILD API: sudo docker build -t api -f "./exp-api/Dockerfile-api" "./exp-api"
# REBUILD SUBSCRIBER: sudo docker build -t subscriber -f "./subscriber/Dockerfile-mqtt" "./subscriber"
