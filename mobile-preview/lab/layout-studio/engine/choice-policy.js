(function(root) {
  'use strict';

  const DEFAULT_COUNT = 6;
  const MIN_COUNT = 3;
  const MAX_COUNT = 12;

  function resolveChoiceCount(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return DEFAULT_COUNT;
    return Math.max(MIN_COUNT, Math.min(MAX_COUNT, parsed));
  }

  const api = { DEFAULT_COUNT, MIN_COUNT, MAX_COUNT, resolveChoiceCount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ChoicePolicy = api;
})(typeof window !== 'undefined' ? window : globalThis);
