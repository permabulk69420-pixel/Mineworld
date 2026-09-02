export function hash(x, y = 0, z = 0, seed = 0) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263)
    ^ Math.imul(z, 1274126177) ^ Math.imul(seed, 1597334677);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
const smooth = t => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;

export function noise2(x, z, seed) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = smooth(x - ix), fz = smooth(z - iz);
  return mix(mix(hash(ix, 0, iz, seed), hash(ix + 1, 0, iz, seed), fx),
    mix(hash(ix, 0, iz + 1, seed), hash(ix + 1, 0, iz + 1, seed), fx), fz) * 2 - 1;
}

export function fbm(x, z, seed) {
  return noise2(x, z, seed) * 0.58 + noise2(x * 2, z * 2, seed + 41) * 0.28
    + noise2(x * 4, z * 4, seed + 83) * 0.14;
}
