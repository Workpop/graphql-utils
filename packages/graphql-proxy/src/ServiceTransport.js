import { HttpLink } from 'apollo-link-http';
import fetch from 'node-fetch';

export default class ServiceLink extends HttpLink {
  constructor({ headers, uri }) {
    super({
      uri,
      headers,
      fetch,
    });
  }
}
