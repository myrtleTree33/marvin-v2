#!/bin/bash
node dist/index.js \
-n ${NUM_NODES} \
-u ${MONGO_URI} \
-M ${MIN_INTERVAL} \
-m ${RAND_INTERVAL} \
-i ${JOB_INTERVAL_MS} \
