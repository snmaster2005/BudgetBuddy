import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Toast } from '@capacitor/toast';
import App from './App';
import { isPlatform } from './utils/platform';

export default function MobileApp() {
  useEffect(() => {
    if (isPlatform('capacitor')) {
      // Set up back button handler for Android
      CapApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          // Show "Press back again to exit" toast
          Toast.show({
            text: 'Press back again to exit',
            duration: 'short',
          });

          // Listen for second back button press
          const timeout = setTimeout(() => {
            CapApp.removeAllListeners();
            setupBackButton();
          }, 2000);

          const backListener = CapApp.addListener('backButton', () => {
            clearTimeout(timeout);
            CapApp.exitApp();
          });

          // Clean up the temporary listener after 2 seconds
          setTimeout(() => {
            backListener.remove();
          }, 2000);
        } else {
          // Handle regular back navigation
          window.history.back();
        }
      });
    }

    return () => {
      if (isPlatform('capacitor')) {
        CapApp.removeAllListeners();
      }
    };
  }, []);

  function setupBackButton() {
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        // Show "Press back again to exit" toast
        Toast.show({
          text: 'Press back again to exit',
          duration: 'short',
        });

        // Listen for second back button press
        const timeout = setTimeout(() => {
          CapApp.removeAllListeners();
          setupBackButton();
        }, 2000);

        const backListener = CapApp.addListener('backButton', () => {
          clearTimeout(timeout);
          CapApp.exitApp();
        });

        // Clean up the temporary listener after 2 seconds
        setTimeout(() => {
          backListener.remove();
        }, 2000);
      } else {
        // Handle regular back navigation
        window.history.back();
      }
    });
  }

  // Return the regular App with mobile-specific optimizations
  return <App />;
}