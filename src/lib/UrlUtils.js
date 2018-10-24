import { URL } from 'url';

export function getAbsoluteUrl(baseUrl, relUrl) {
  try {
    const url = new URL(relUrl, baseUrl);
    return url.href;
  } catch (e) {
    return null;
  }
}

export function getBaseUrl(absoluteUrl) {
  return new URL(absoluteUrl).origin;
}

export function isBaseOf(baseUrlStr, absoluteUrlStr) {
  try {
    const baseUrl = new URL(baseUrlStr);
    const absoluteUrl = new URL(absoluteUrlStr);
    return baseUrl.hostname === absoluteUrl.hostname;
  } catch (e) {
    return false;
  }
}

export function isAbsoluteUrl(urlStr) {
  const pat = /^https?:\/\//i;
  return pat.test(urlStr);
}

export function isValidUrl(urlStr) {
  // null strings are not valid URLs!!
  if (!urlStr) {
    return false;
  }

  // try to parse url.  If not successful, fail.
  try {
    const url = new URL(urlStr);
  } catch (e) {
    return false;
  }

  if (!isAbsoluteUrl(urlStr)) {
    return false;
  }

  // then, check url are not hotlinks, etc.
  return (
    !urlStr.startsWith('#') &&
    !urlStr.startsWith('tel:') &&
    !urlStr.startsWith('mailto:')
  );
}

export function resolveUrl(baseUrl, urlToAdd) {
  try {
    if (!isValidUrl(urlToAdd)) {
      return null;
    }
    if (!urlToAdd || !baseUrl) {
      return null;
    }
    if (isAbsoluteUrl(urlToAdd)) {
      if (isBaseOf(baseUrl, urlToAdd)) {
        return urlToAdd;
      }
      return null;
    }
    return getAbsoluteUrl(baseUrl, urlToAdd);
  } catch (e) {
    return null;
  }
}
