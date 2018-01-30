import { isObject, mapValues, includes } from 'lodash';

// A list of resolver argument names that should be omitted from any logs
// For example, we don't want to log raw user passwords, if provided as an
// argument to a resolver.
//
// The value will be logged as "<redacted>"
export const UNSAFE_ARGS = [
  'password',
  'documentNumber',
  'socialSecurityNumber',
];

function mapValuesDeep(v: any, cb: Function, k: ?string): any {
  if (isObject(v)) {
    return mapValues(v, (v2: any, k2: string): any => {
      return mapValuesDeep(v2, cb, k2);
    });
  }

  return cb(v, k);
}

export function sanitizeArgs(logObject: Object): any {
  // prevent logging of certain arguments passed to the resolver
  // for example, passwords
  return mapValuesDeep(logObject, (v: any, k: string): any => {
    if (includes(UNSAFE_ARGS, k)) {
      return '<redacted>';
    }
    return v;
  });
}
