// import XXHash from 'xxhash';
import crypto from 'crypto';

export function genNumArray(n) {
  return Array.apply(null, { length: n }).map(Number.call, Number);
}

export function hash(s) {
  return crypto
    .createHash('sha1')
    .update(s)
    .digest('base64');
  // const salt = 0xcafebabe;
  // return XXHash.hash(s, salt);
}
