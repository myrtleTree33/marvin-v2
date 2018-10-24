import XXHash from 'xxhash';

export function genNumArray(n) {
  return Array.apply(null, { length: n }).map(Number.call, Number);
}

export function hash(s) {
  const salt = 0xcafebabe;
  return XXHash.hash(s, salt);
}
