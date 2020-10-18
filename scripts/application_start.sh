#!/bin/bash
# Stop all servers and start the server
pm2 stop all
pm2 start /home/ubuntu/klynd/app.js
