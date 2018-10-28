#!/bin/bash
node dist/index.js \
-n ${NUM_NODES} \
-u ${MONGO_URI} \
-M ${MIN_INTERVAL} \
-m ${RAND_INTERVAL} \
-i ${JOB_INTERVAL_MS} \
-z ${DEFAULT_CACHE_TIME_MS} \
-x ${MIN_CACHE_TIME_MS} \
-c ${MAX_CACHE_TIME_MS} \
-v ${MAX_DIFF_TOLERANCE} 
