import { URL } from 'url';

export function getBaseUrl(absoluteUrl) {
  return new URL(absoluteUrl).origin;
}

function getRootDomain(url) {
  const tokens = url.host.split('.');
  if (tokens.length < 3) {
    return url.host;
  }
  return tokens.splice(1).join('.');
}

export function resolveUrl(baseUrl, urlToAdd) {
  try {
    if (!baseUrl || !urlToAdd) {
      return null;
    }

    const baseUrl2 = new URL(baseUrl);
    const resolvedUrl = new URL(urlToAdd, baseUrl);

    // invalid url
    if (!resolvedUrl) {
      return null;
    }

    // different origins
    if (getRootDomain(baseUrl2) !== getRootDomain(resolvedUrl)) {
      return null;
    }

    // not a subpath of origin url
    if (resolvedUrl.pathname.indexOf(baseUrl2.pathname) < 0) {
      return null;
    }
    return resolvedUrl.toString();
  } catch (e) {
    return null;
  }
}
