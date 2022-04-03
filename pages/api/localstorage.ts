export function getStorage(key: string): string {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(key) || ""
  }
  return ""
}

export function setStorage(key: string, value: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, value)
  }
}
