import cheerio from 'cheerio';
import axios from 'axios';
import sleep from 'await-sleep';

import { resolveUrl, getBaseUrl } from './UrlUtils';
import logger from './util/logger';
import { genNumArray, hash } from './Utils';
import HashedItem from './models/HashedItem';
import Item from './models/Item';

const DEFAULT_CACHE_TIME_MS = 1000 * 60 * 60 * 2; // 2 hours
const MIN_CACHE_TIME_MS = 1000 * 60 * 60 * 2; // 2 hours
const MAX_CACHE_TIME_MS = 1000 * 60 * 60 * 24 * 2; // 2 Days

class Marvin {
  constructor({
    rootUrl = null,
    minInterval = 200,
    randInterval = 2000,
    numJobs = 1,
    jobsIntervalMaxSeedMs = 2000
  }) {
    this.minInterval = minInterval;
    this.randInterval = randInterval;
    this.numJobs = numJobs;
    this.jobsIntervalMaxSeedMs = jobsIntervalMaxSeedMs;

    // load URL by default, if specified.
    if (rootUrl) {
      this.loadUrl({ rootUrl, priority: -1 });
      return;
    }
    logger.info('No rootURL specified; proceeding to draw from queue.');
  }

  async enqueue({ rootUrl, url, priority }) {
    const item = new Item({ rootUrl, url, priority });
    await Item.findOneAndUpdate(
      {
        url
      },
      item,
      { upsert: true }
    );
    logger.info(`Adding URL=${url} to queue.`);
  }

  loadUrl({ url, priority = -1 }) {
    (async () => {
      await this.enqueue({ rootUrl: url, url, priority });
    })();
    return this;
  }

  async next() {
    const nextItem = await Item.findOneAndDelete({});
    if (!this.nextItem) {
      return Promise.resolve(null);
    }
    return nextItem;
  }

  start() {
    logger.info('Marvin V2 started.');
    const { minInterval, randInterval } = this;
    const timeDelay = minInterval + Math.random() * randInterval;

    const runJob = jobId => {
      (async () => {
        let scrapeSuccessful = false;
        while (!scrapeSuccessful) {
          const item = await this.next();

          // attempt to scrape page if item in queue
          if (item) {
            scrapeSuccessful = false;
            try {
              scrapeSuccessful = await this.scrapePage(jobId, item);
            } catch (e) {}
          } else {
            // this is to prevent overpolling if there is no item to retrieve
            logger.info(`[jobId=${jobId}] No item in queue, sleeping..`);
            sleep(timeDelay);
          }
        }

        // rerun job again
        setTimeout(() => {
          runJob(jobId);
        }, timeDelay);
      })();
    };

    // create an array to pass index to each worker
    const numArray = genNumArray(this.numJobs);
    numArray.forEach(i => {
      logger.info(`Started job ${i}..`);
      (async () => {
        const sleepIntervalMs = Math.random() * this.jobsIntervalMaxSeedMs;
        await sleep(sleepIntervalMs);
        runJob(i);
      })();
    });
  }

  async scrapeAllLinksAndPutInQueue(rootUrl, data) {
    try {
      const $ = cheerio.load(data);
      // enqueue each URL found
      $('a').each((i, link) => {
        (async () => {
          const expandedRelUrl = $(link).attr('href');
          const expandedUrl = resolveUrl(rootUrl, expandedRelUrl);
          if (!expandedUrl) {
            return; // skip for current link
          }
          this.enqueue({
            url: expandedUrl,
            rootUrl: getBaseUrl(expandedUrl),
            priority: 1
          });
        })();
      });
    } catch (e) {
      // silently fail for error TODO
    }
  }

  async hashPageAndPutInDb({ url, data, lastScraped, intervalMs }) {
    const hashedStr = hash(data);
    const hashedItem = new HashedItem({
      url,
      hashedStr,
      lastScraped,
      intervalMs
    });
    return hashedItem.save();
  }

  async scrapePage(jobId, item) {
    const { url, rootUrl } = item;
    const hashedItem = await HashedItem.findOne({ url });

    if (!hashedItem) {
      const result = await axios.get(url);
      const { data } = result.data;
      await this.scrapeAllLinksAndPutInQueue(rootUrl, data);
      await this.hashPageAndPutInDb({
        url,
        data,
        lastScraped: Date.now(),
        intervalMs: DEFAULT_CACHE_TIME_MS
      });
      return Promise.resolve(true);
    }

    const { hashedStr, lastScraped, intervalMs } = hashedItem;

    // if time not reached yet, ignore
    const isTimeReached = lastScraped + intervalMs > new Date();
    if (!isTimeReached) {
      return Promise.resolve(false);
    }

    // retrieve page
    const result = await axios.get(url);
    const { data } = result.data;
    const hashedStrNew = hash(data);

    // if hash same, increase time persistency in cache
    if (hashedStrNew === hashedStr) {
      await HashedItem.findOneAndUpdate(
        { url },
        {
          lastScraped: new Date(),
          intervalMs: Math.floor(intervalMs * 2, MAX_CACHE_TIME_MS)
        },
        { upsert: true }
      );
      return Promise.resolve(false);
    }

    // if hash is different, update hash and put in DB
    await this.scrapeAllLinksAndPutInQueue(rootUrl, data);
    await HashedItem.findOneAndUpdate(
      { url },
      {
        hashedStr: hashedStrNew,
        lastScraped: new Date(),
        intervalMs: Math.ceil(intervalMs / 2, MIN_CACHE_TIME_MS)
      },
      { upsert: true }
    );
    return Promise.resolve(true);
  }
}

export default Marvin;
