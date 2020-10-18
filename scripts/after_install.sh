#!/bin/bash
sudo mkdir /home/ubuntu/klynd
sudo aws s3 cp --region eu-west-1 "s3://klynd-api-codedeploy-deployment/config/dev.env" "/home/ubuntu/klynd/.env"
cd /home/ubuntu/klynd
sudo npm  cache --force clean
sudo npm install  --unsafe-perm
