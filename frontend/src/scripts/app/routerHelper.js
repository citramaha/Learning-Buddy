// app/routeHelper.js

export function extractPathSegments(path) {
  const parts = path.split('/');
  return {
    resource: parts[1] || null,
    id: parts[2] || null,
  };
}

export function getActivePathname() {
  return window.location.hash.replace('#', '') || '/';
}

export function normalizeRoute(pathname) {
  const pathSegments = extractPathSegments(pathname);
  let result = '';

  if (pathSegments.resource) result += `/${pathSegments.resource}`;
  if (pathSegments.id) result += `/${pathSegments.id}`;

  return result || '/';
}

export function getActiveRoute() {
  const pathname = getActivePathname().split('?')[0];
  return normalizeRoute(pathname);
}

export function getQueryParams() {
  const hash = window.location.hash || '';
  const qIndex = hash.indexOf('?');
  if (qIndex === -1) return {};

  const queryString = hash.substring(qIndex + 1);
  return Object.fromEntries(new URLSearchParams(queryString));
}

export function navigateTo(path) {
  // set the hash to navigate. Accepts paths like '/academy' or '/academy?x=1'
  window.location.hash = path;
}
