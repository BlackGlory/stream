let cache = new WeakMap()

export function getCache() {
  return cache
}

export function resetCache() {
  return cache = new WeakMap()
}
