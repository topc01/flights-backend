#!/bin/bash

sudo docker rmi subscriber
sudo docker build -t subscriber -f "subscriber/Dockerfile-mqtt" ./subscriber