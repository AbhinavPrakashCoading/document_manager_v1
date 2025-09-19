'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAStatus {
  isSupported: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  swRegistration: ServiceWorkerRegistration | null;
}

export function usePWA() {
  const [pwaStatus, setPWAStatus] = useState<PWAStatus>({
    isSupported: false,
    isInstalled: false,
    isOnline: true,
    canInstall: false,
    swRegistration: null,
  });

  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Check PWA support
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    
    setPWAStatus(prev => ({
      ...prev,
      isSupported,
      isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    }));

    if (!isSupported) {
      console.log('PWA features not supported in this browser');
      return;
    }

    // Register service worker
    registerServiceWorker();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as any);
      setPWAStatus(prev => ({ ...prev, canInstall: true }));
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log('PWA: App was installed');
      setInstallPrompt(null);
      setPWAStatus(prev => ({ ...prev, isInstalled: true, canInstall: false }));
      toast.success('App installed successfully!', {
        icon: '📱',
        duration: 4000,
      });
    };

    // Online/offline status
    const handleOnline = () => {
      setPWAStatus(prev => ({ ...prev, isOnline: true }));
      toast.success('Back online! Syncing documents...', {
        icon: '🌐',
        duration: 3000,
      });
      
      // Trigger background sync
      if (pwaStatus.swRegistration) {
        pwaStatus.swRegistration.active?.postMessage({
          type: 'SCHEDULE_SYNC'
        });
      }
    };

    const handleOffline = () => {
      setPWAStatus(prev => ({ ...prev, isOnline: false }));
      toast('Working offline - documents will sync when online', {
        icon: '📴',
        duration: 4000,
      });
    };

    // Check if already installed
    const checkIfInstalled = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setPWAStatus(prev => ({ ...prev, isInstalled: true }));
      }
    };

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkIfInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('PWA: Service Worker registered successfully');
      
      setPWAStatus(prev => ({ ...prev, swRegistration: registration }));

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('PWA: New version available');
        
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version is available
              toast((t) => (
                <div className="flex flex-col gap-2">
                  <p className="font-medium">New version available!</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        toast.dismiss(t.id);
                        window.location.reload();
                      }}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                    >
                      Later
                    </button>
                  </div>
                </div>
              ), {
                duration: 10000,
                icon: '🔄',
              });
            }
          });
        }
      });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('PWA: Message from service worker:', event.data);
        
        if (event.data.type === 'SYNC_COMPLETE') {
          toast.success(`Synced ${event.data.count} documents`, {
            icon: '☁️',
            duration: 3000,
          });
        }
      });

    } catch (error) {
      console.error('PWA: Service Worker registration failed:', error);
      toast.error('Failed to enable offline features');
    }
  };

  const installApp = async () => {
    if (!installPrompt) {
      toast.error('Installation not available');
      return;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      console.log(`PWA: Install prompt outcome: ${outcome}`);
      
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        setPWAStatus(prev => ({ ...prev, canInstall: false }));
      }
    } catch (error) {
      console.error('PWA: Installation failed:', error);
      toast.error('Installation failed');
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported');
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      toast.success('Notifications enabled!');
      return true;
    } else {
      toast.error('Notification permission denied');
      return false;
    }
  };

  const scheduleBackgroundSync = () => {
    if (pwaStatus.swRegistration && 'sync' in pwaStatus.swRegistration) {
      (pwaStatus.swRegistration as any).sync.register('background-document-sync');
      toast.success('Background sync scheduled');
    } else {
      // Fallback for browsers without background sync
      pwaStatus.swRegistration?.active?.postMessage({
        type: 'SCHEDULE_SYNC'
      });
      toast.success('Sync scheduled');
    }
  };

  const processOfflineDocuments = () => {
    if (pwaStatus.swRegistration) {
      pwaStatus.swRegistration.active?.postMessage({
        type: 'PROCESS_OFFLINE'
      });
      toast.success('Processing documents offline...');
    }
  };

  return {
    pwaStatus,
    installApp,
    requestNotificationPermission,
    scheduleBackgroundSync,
    processOfflineDocuments,
  };
}

export function PWAInstallPrompt() {
  const { pwaStatus, installApp } = usePWA();

  if (!pwaStatus.canInstall || pwaStatus.isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="text-2xl">📱</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Install Document Manager</h3>
          <p className="text-sm text-gray-600 mt-1">
            Get the full offline experience with background document processing
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={installApp}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Install
            </button>
            <button
              onClick={() => {
                // This will be handled by the parent component if needed
              }}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PWAStatusIndicator() {
  const { pwaStatus } = usePWA();

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${
        pwaStatus.isOnline ? 'bg-green-500' : 'bg-orange-500'
      }`} />
      <span className="text-gray-600">
        {pwaStatus.isOnline ? 'Online' : 'Offline'}
        {pwaStatus.isInstalled && ' • Installed'}
      </span>
    </div>
  );
}