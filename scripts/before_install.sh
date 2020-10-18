#!/bin/bash
# Install node.js and PM2

curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get -y install nodejs
sudo apt-get -y  install gcc g++ make
npm install pm2 -g