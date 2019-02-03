import cheerio from 'cheerio';
import axios from 'axios';
import sleep from 'await-sleep';
import Boilerpipe from 'boilerpipe';

import { resolveUrl, getBaseUrl } from './UrlUtils';
import logger from './util/logger';
import { genNumArray, hash, hashesAreSimilar } from './Utils';
import HashedItem from './models/HashedItem';
import Item from './models/Item';
import QueueItem from './models/QueueItem';

class Marvin {
  constructor({
    rootUrl = null,
    minInterval = 200,
    randInterval = 2000,
    numJobs = 1,
    jobsIntervalMaxSeedMs = 2000,
    defaultCacheTimeMs = 1000 * 60 * 60 * 2, // 2 hours
    minCacheTimeMs = 1000 * 60 * 60 * 2, // 2 hours
    maxCacheTimeMs = 1000 * 60 * 60 * 24 * 2, // 2 days
    maxDiffTolerance = 0.12
  }) {
    this.minInterval = minInterval;
    this.randInterval = randInterval;
    this.numJobs = numJobs;
    this.jobsIntervalMaxSeedMs = jobsIntervalMaxSeedMs;
    this.defaultCacheTimeMs = defaultCacheTimeMs;
    this.minCacheTimeMs = minCacheTimeMs;
    this.maxCacheTimeMs = maxCacheTimeMs;
    this.maxDiffTolerance = maxDiffTolerance;

    // load URL by default, if specified.
    if (rootUrl) {
      this.enqueue({ rootUrl, url: rootUrl, priority: -1 });
      logger.info(`Adding URL=${rootUrl} to queue.`);
      return;
    }
    logger.info('No rootURL specified; proceeding to draw from queue.');
  }

  async enqueue({ rootUrl, url, priority, depth, maxRandDelayMs }) {
    const queueItem = new QueueItem({
      rootUrl,
      url,
      priority,
      depth,
      maxRandDelayMs
    });
    queueItem.save().catch(e => {
      if (e && e.code !== 11000) {
        // ignore for existing item in queue
        // (duplicate key error: 11000)
        // logger.error(e);
        logger.error(`Error occured scraping url=${url}`);
      }
    });
  }

  async next() {
    const nextQueueItem = await QueueItem.findOneAndDelete({});
    if (!nextQueueItem) {
      return Promise.resolve(null);
    }
    logger.debug(`Next url to poll, url=${nextQueueItem.url}`);
    return nextQueueItem;
  }

  start() {
    logger.info('Marvin V2 started.');
    const { minInterval, randInterval } = this;
    let timeDelay = minInterval + Math.random() * randInterval;

    const runJob = jobId => {
      // reset with new time delay
      timeDelay = minInterval + Math.random() * randInterval;
      (async () => {
        let queueItem = null;
        while (!queueItem) {
          queueItem = await this.next();
          if (!queueItem) {
            // this is to prevent overpolling if there is no item to retrieve
            logger.debug(`[jobId=${jobId}] No item in queue, sleeping..`);
            await sleep(1000);
          }
        }

        // attempt to scrape page if item in queue
        try {
          await this.scrapePage(jobId, queueItem);
        } catch (e) {
          logger.error(`Error occured scraping jobId=${jobId}`);
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

  async scrapeAllLinksAndPutInQueue({
    jobId,
    rootUrl,
    data,
    depth,
    maxRandDelayMs
  }) {
    try {
      // if depth is -1, means infinite depth.
      // leave depth at -1.
      // else decrement depth.
      const newDepth = depth !== -1 ? depth - 1 : -1;
      if (newDepth === 0) {
        // do not enqueue and
        // exit early; max depth reached
        logger.debug('terminating as max depth reached.');
        return;
      }

      const $ = cheerio.load(data);

      // enqueue each URL found
      // TODO IMPROVEMENT: the list of urls should be limited to a set, before adding
      $('a').each((i, link) => {
        (async () => {
          const expandedRelUrl = $(link).attr('href');
          const expandedUrl = resolveUrl(rootUrl, expandedRelUrl);
          if (!expandedUrl) {
            return; // skip for current link
          }
          try {
            await this.enqueue({
              url: expandedUrl,
              rootUrl: getBaseUrl(expandedUrl),
              depth: newDepth,
              maxRandDelayMs,
              priority: 1
            });
          } catch (e) {
            logger.error(`Error enquing url=${expandedUrl}`);
            return; // do not show msg below
          }
          logger.debug(`JobId=${jobId} Enquing url=${expandedUrl}`);
        })();
      });
    } catch (e) {
      // silently fail for error TODO
    }
  }

  async hashPageAndPutInDb({ url, data, lastScraped, intervalMs }) {
    const hashedObj = hash(data);
    const hashedItem = new HashedItem({
      url,
      hashedObj,
      lastScraped,
      intervalMs
    });
    return hashedItem.save();
  }

  async savePage({ url, title, plainText }) {
    if (!plainText) {
      // ignore upsert silently if no plainText payload
      return Promise.resolve();
    }

    const originUrl = new URL(url).origin;

    return Item.findOneAndUpdate(
      { url },
      { originUrl, title, plainText },
      {
        upsert: true,
        setDefaultsOnInsert: true
      }
    );
  }

  async extractTitle({ htmlText }) {
    const $ = cheerio.load(htmlText);
    const title = $('title').text();
    return Promise.resolve(title);
  }

  async extractArticleText({ htmlText }) {
    return new Promise((resolve, reject) => {
      const boilerpipe = new Boilerpipe({
        extractor: Boilerpipe.Extractor.Article,
        html: htmlText
      });

      boilerpipe.getText((err, text) => {
        if (err) {
          return reject(text);
        }
        const resolvedText = text
          .replace(/Advertisement/g, '')
          .replace(/\n/g, '\n\n')
          .replace('\n\n\n+', '\n\n');

        return resolve(resolvedText);
      });
    });
  }

  async scrapePage(jobId, item) {
    const { url, rootUrl, depth, maxRandDelayMs } = item;

    // sleep for maxRandDelayMs before continuing
    const sleepTime = Math.random() * maxRandDelayMs;
    logger.debug(`Sleeping for ${sleepTime}..`);
    await sleep(sleepTime);

    const hashedItem = await HashedItem.findOne({ url });
    logger.info(`Processing url=${url}..`);

    if (!hashedItem) {
      logger.info(`url=${url} is new, adding..`);
      const result = await axios.get(url);
      const { data, headers } = result;

      // if not html page, then reject and ignore
      const contentType = headers['content-type'] || '';
      if (!contentType.includes('text/html')) {
        logger.debug(`Ignoring ${url}, as content-type is ${contentType}`);
        return Promise.resolve(false);
      }
      await this.scrapeAllLinksAndPutInQueue({
        jobId,
        rootUrl,
        data,
        depth,
        maxRandDelayMs
      });
      const plainText = await this.extractArticleText({ htmlText: data });
      const title = await this.extractTitle({ htmlText: data });
      await this.hashPageAndPutInDb({
        url,
        data,
        lastScraped: Date.now(),
        intervalMs: this.defaultCacheTimeMs
      });
      await this.savePage({ url, title, plainText });
      return Promise.resolve(true);
    }

    const { hashedObj, lastScraped, intervalMs } = hashedItem;

    // if time not reached yet, ignore
    const isTimeReached = lastScraped.getTime() + intervalMs < Date.now();
    if (!isTimeReached) {
      return Promise.resolve(false);
    }

    // retrieve page
    const result = await axios.get(url);
    const { data } = result;
    const hashedObjNew = hash(data);

    // if hash same, increase time persistency in cache
    if (hashesAreSimilar(hashedObj, hashedObjNew, this.maxDiffTolerance)) {
      logger.info(`JobId=${jobId} Increasing time interval for url=${url}`);
      await HashedItem.findOneAndUpdate(
        { url },
        {
          lastScraped: new Date(),
          intervalMs: Math.floor(intervalMs * 2, this.maxCacheTimeMs)
        },
        { upsert: true }
      );
      return Promise.resolve(false);
    }

    // if hash is different, update hash and put in DB
    // TODO improvement: this can be parallel
    logger.info(`JobId=${jobId} Reducing time interval for url=${url}`);
    await this.scrapeAllLinksAndPutInQueue({
      jobId,
      rootUrl,
      data,
      depth,
      maxRandDelayMs
    });
    await HashedItem.findOneAndUpdate(
      { url },
      {
        hashedObj: hashedObjNew,
        lastScraped: new Date(),
        intervalMs: Math.ceil(intervalMs / 2, this.minCacheTimeMs)
      },
      { upsert: true }
    );
    const plainText = await this.extractArticleText({ htmlText: data });
    const title = await this.extractTitle({ htmlText: data });
    await this.savePage({ url, title, plainText });
    return Promise.resolve(true);
  }
}

export default Marvin;
