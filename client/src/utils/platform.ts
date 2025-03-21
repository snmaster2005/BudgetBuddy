// Platform detection utilities

/**
 * Possible platforms the app can run on
 */
export type Platform = 'web' | 'capacitor' | 'ios' | 'android';

/**
 * Detect if the app is running on a specific platform
 * @param platform Platform to check for
 * @returns boolean indicating if running on the specified platform
 */
export function isPlatform(platform: Platform): boolean {
  switch (platform) {
    case 'web':
      return !isCapacitor();
    case 'capacitor':
      return isCapacitor();
    case 'ios':
      return isCapacitor() && isIos();
    case 'android':
      return isCapacitor() && isAndroid();
    default:
      return false;
  }
}

/**
 * Detect if running within Capacitor
 */
export function isCapacitor(): boolean {
  const win = window as any;
  return !!(win.Capacitor || win.Cordova);
}

/**
 * Detect if running on iOS
 */
export function isIos(): boolean {
  const win = window as any;
  
  if (win?.Capacitor?.getPlatform) {
    return win.Capacitor.getPlatform() === 'ios';
  }
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

/**
 * Detect if running on Android
 */
export function isAndroid(): boolean {
  const win = window as any;
  
  if (win?.Capacitor?.getPlatform) {
    return win.Capacitor.getPlatform() === 'android';
  }
  
  return /android/i.test(navigator.userAgent);
}