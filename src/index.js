#!/usr/bin/env node

import mongoose from 'mongoose';
import Marvin from './lib/Marvin';
import logger from './lib/util/logger';

require('dotenv').config();

export default function runMain() {
  const {
    MONGO_URI,
    SCRAPE_URL,
    MIN_INTERVAL,
    RAND_INTERVAL,
    NUM_JOBS,
    JOBS_INTERVAL_MAX_SEED_MS,
    DEFAULT_CACHE_TIME_MS,
    MIN_CACHE_TIME_MS,
    MAX_CACHE_TIME_MS,
    MAX_DIFF_TOLERANCE
  } = process.env;

  logger.info(`Running Scraper-v2 at ${new Date()}..`);

  mongoose.connect(MONGO_URI);

  const marvin = new Marvin({
    // rootUrl: 'https://www.kompasiana.com/',
    // rootUrl: SCRAPE_URL,
    minInterval: parseInt(MIN_INTERVAL, 10),
    randInterval: parseInt(RAND_INTERVAL, 10),
    numJobs: parseInt(NUM_JOBS, 10),
    jobsIntervalMaxSeedMs: parseInt(JOBS_INTERVAL_MAX_SEED_MS, 10),
    defaultCacheTimeMs: parseInt(DEFAULT_CACHE_TIME_MS, 10),
    minCacheTimeMs: parseInt(MIN_CACHE_TIME_MS, 10),
    maxCacheTimeMs: parseInt(MAX_CACHE_TIME_MS, 10),
    maxDiffTolerance: parseFloat(MAX_DIFF_TOLERANCE)
  });
  marvin.start();
}

if (require.main === module) {
  runMain();
}

// app
//   .version('0.0.1')
//   .option(
//     '-u, --uri [uri]',
//     'Mongo URI to use',
//     'mongodb://localhost/newsfeed'
//   )
//   .option(
//     '-M, --min-interval [mSecs]',
//     'The minimum interval between requests, in milliseconds',
//     200
//   )
//   .option(
//     '-m, --rand-interval [mSecs]',
//     'The random interval to use between requests, in milliseconds',
//     1000
//   )
//   .option('-n, --numJobs [numJobs]', 'The number of workers to spawn', 20)
//   .option(
//     '-i, --jobIntervalMs [ms]',
//     'The number of milliseconds to wait before launching each job',
//     200
//   )
//   .option(
//     '-s, --scrapeUrl [url]',
//     'The URL to start scraping.  If not specified, pulls one from the dsitributed queue.'
//   )
//   .option(
//     '-z, --defaultCacheTimeMs [millisecs]',
//     'The default persistency cache time to use for hashes',
//     1000 * 60 * 60 * 2
//   )
//   .option(
//     '-x, --minCacheTimeMs [millisecs]',
//     'The min persistency cache time to use for hashes',
//     1000 * 60 * 60 * 2
//   )
//   .option(
//     '-c, --maxCacheTimeMs [millisecs]',
//     'The max persistency cache time to use for hashes',
//     1000 * 60 * 60 * 24 * 2
//   )
//   .option(
//     '-v, --maxDiffTolerance [float]',
//     'The maximum diff tolerance to use for comparison between hashes',
//     0.12
//   )
//   .parse(process.argv);
