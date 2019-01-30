import logger from './util/logger';

export function genNumArray(n) {
  return Array.apply(null, { length: n }).map(Number.call, Number);
}

export function hash(s) {
  const output = {
    e: 0,
    t: 0,
    o: 0,
    i: 0,
    a: 0,
    n: 0,
    s: 0
  };
  for (let i = 0; i < 5000; i++) {
    const currChar = s[i];
    if (output[currChar] >= 0) {
      output[currChar] += 1;
    }
  }
  return output;
}

export function hashesAreSimilar(oldHash, newHash, maxDiffTolerance = 0.1) {
  return false; // TODO monkey patch to force update
  // let diffToleranceCalc = 0;

  // // if the page had invalid filtering, no chars will be shown.
  // // in that case, default to FALSE (hashes are not similar, force update.)
  // // let containsNonZero = false;

  // for (const [k, v] of Object.entries(oldHash)) {
  //   if (v === 0) {
  //     continue; // ignore for divide by infinity
  //   }
  //   // containsNonZero = true; // v is non zero
  //   diffToleranceCalc += Math.abs(v - newHash[k]) / v;
  // }

  // // if (!containsNonZero) {
  // //   // force update as page is blank page.
  // //   return false;
  // // }

  // diffToleranceCalc /= Object.entries(oldHash).length;
  // logger.info(`--- HASH COEFFICIENT=${diffToleranceCalc} ---`);
  // return diffToleranceCalc < maxDiffTolerance;
}
