#!/bin/bash

PRIVATE_KEY_FILE="/tmp/jwt.key"
PUBLIC_KEY_FILE="/tmp/jwt.key.pub"

function print() {
  awk 'NF {sub(/\r/, ""); printf "%s\\n", $0}'
}

ssh-keygen -t rsa -b 4096 -m PEM -f $PRIVATE_KEY_FILE -q -N "" > /dev/null 2>&1
openssl rsa -in $PRIVATE_KEY_FILE -pubout -outform PEM -out $PUBLIC_KEY_FILE > /dev/null 2>&1

echo -n "JWT_PRIVATE=\""
print < $PRIVATE_KEY_FILE
echo "\""

echo -n "JWT_PUBLIC=\""
print < $PUBLIC_KEY_FILE
echo "\""

rm -f $PRIVATE_KEY_FILE
rm -f $PUBLIC_KEY_FILE
