import React from 'react';
import App from './App';

/**
 * Mobile app wrapper component
 * This component will be used when the app is running in Capacitor (Android/iOS)
 * For now, it's a simple pass-through to the main App component
 * 
 * Mobile-specific functionality will be initialized from native code
 */
export default function MobileApp() {
  return <App />;
}