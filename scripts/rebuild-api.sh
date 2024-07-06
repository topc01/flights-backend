#!/bin/bash

sudo docker rmi api
sudo docker build -t api -f "exp-api/Dockerfile-api" ./exp-api
