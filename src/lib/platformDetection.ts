export function isWindows(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  
  const userAgent = window.navigator.userAgent.toLowerCase()
  return userAgent.includes('windows')
}

export function shouldUseEmojiFallback(): boolean {
  return isWindows()
}
