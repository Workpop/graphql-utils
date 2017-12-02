import { isNaN } from 'lodash';

// Taken from https://github.com/substack/semver-compare
export function compareSemVer(a, b) {
  const pa = a.split('.');
  const pb = b.split('.');
  for (var i = 0; i < 3; i += 1) {
    const na = Number(pa[i]);
    const nb = Number(pb[i]);
    if (na > nb) {
      return 1;
    }
    if (nb > na) {
      return -1;
    }
    if (!isNaN(na) && isNaN(nb)) {
      return 1;
    }
    if (isNaN(na) && !isNaN(nb)) {
      return -1;
    }
  }
  return 0;
}
