#!/bin/bash
set -e

SERVER="perishable_ecommerce_db_server";
PW="mysecretpassword";
DB="perishable_ecommerce_db";

echo "starting container in case it's not up"
docker start perishable_ecommerce_db_server


# wait for pg to start
echo "sleep wait for pg-server [$SERVER] to start";
sleep 3;