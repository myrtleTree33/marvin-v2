import cheerio from 'cheerio';
import axios from 'axios';
import sleep from 'await-sleep';

import Cache from './DistributedCache';

import { resolveUrl, getBaseUrl } from './UrlUtils';
import logger from './util/logger';
import { genNumArray } from './Utils';

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
    this.cache = new Cache();

    // load URL by default, if specified.
    if (rootUrl) {
      this.loadUrl({ rootUrl, priority: -1 });
      return;
    }
    logger.info('No rootURL specified; proceeding to draw from queue.');
  }

  loadUrl({ url, priority = -1 }) {
    (async () => {
      this.cache.loadUrl({ url, priority });
      logger.info(`Addin URL=${url} to queue.`);
    })();
    return this;
  }

  start() {
    logger.info('Marvin V2 started.');
    const { cache, minInterval, randInterval } = this;
    const timeDelay = minInterval + Math.random() * randInterval;

    const runJob = jobId => {
      (async () => {
        let scrapeSuccessful = false;
        while (!scrapeSuccessful) {
          const item = await cache.next();
          if (item) {
            scrapeSuccessful = true;
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

  // TODO debug here ----------------------------------
  async scrapePage(jobId, item) {
    const { url, rootUrl } = item;
    try {
      const result = await axios.get(url);
      const $ = cheerio.load(result.data);
      // store the page asynchronously
      this.store.upsert({ url, htmlText: result.data });
      const numLinks = $('a').length;
      logger.info(
        `[JobId=${jobId}] Scraping url=${url} ${numLinks} links found`
      );

      $('a').each((i, link) => {
        (async () => {
          const expandedRelUrl = $(link).attr('href');
          const expandedUrl = resolveUrl(rootUrl, expandedRelUrl);
          if (expandedUrl) {
            const isAdded = await this.cache.add({
              url: expandedUrl,
              rootUrl: getBaseUrl(expandedUrl),
              priority: 1
            });

            // TODO there is issue with duplicate URLs
            if (isAdded) {
              logger.info(`[JobId=${jobId}] Added ${expandedUrl}`);
            }
          }
        })();
      });
      await this.cache.delist(item);
    } catch (e) {
      logger.error(`Unable to retrieve page ${url}`);
      logger.error(e);
      // TODO put link in the retry queue, if need be.
    }
  }
}

export default Marvin;
