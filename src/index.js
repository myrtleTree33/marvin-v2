#!/usr/bin/env node

import mongoose from 'mongoose';
import app from 'commander';

import Marvin from './lib/Marvin';
import logger from './lib/util/logger';

export default function runMain() {
  app
    .version('0.0.1')
    .option('-u, --uri [uri]', 'Mongo URI to use', 'mongodb://localhost/test')
    .option(
      '-M, --min-interval [mSecs]',
      'The minimum interval between requests, in milliseconds',
      200
    )
    .option(
      '-m, --rand-interval [mSecs]',
      'The random interval to use between requests, in milliseconds',
      1000
    )
    .option('-n, --numJobs [numJobs]', 'The number of workers to spawn', 20)
    .option(
      '-i, --jobIntervalMs [ms]',
      'The number of milliseconds to wait before launching each job',
      200
    )
    .option(
      '-s, --scrapeUrl [url]',
      'The URL to start scraping.  If not specified, pulls one from the dsitributed queue.'
    )
    .option(
      '-z, --defaultCacheTimeMs [millisecs]',
      'The default persistency cache time to use for hashes',
      1000 * 60 * 60 * 2
    )
    .option(
      '-x, --minCacheTimeMs [millisecs]',
      'The min persistency cache time to use for hashes',
      1000 * 60 * 60 * 2
    )
    .option(
      '-c, --maxCacheTimeMs [millisecs]',
      'The max persistency cache time to use for hashes',
      1000 * 60 * 60 * 24 * 2
    )
    .option(
      '-v, --maxDiffTolerance [float]',
      'The maximum diff tolerance to use for comparison between hashes',
      0.12
    )
    .parse(process.argv);

  mongoose.connect(app.uri);

  const marvin = new Marvin({
    // rootUrl: 'https://www.kompasiana.com/',
    rootUrl: app.scrapeUrl,
    minInterval: app.minInterval,
    randInterval: app.randInterval,
    numJobs: app.numJobs,
    jobsIntervalMaxSeedMs: app.jobsIntervalMs,
    defaultCacheTimeMs: app.defaultCacheTimeMs, // 2 hours
    minCacheTimeMs: app.minCacheTimeMs, // 2 hours
    maxCacheTimeMs: app.maxCacheTimeMs, // 2 days
    maxDiffTolerance: app.maxDiffTolerance
  });
  marvin.start();
}

if (require.main === module) {
  runMain();
}
