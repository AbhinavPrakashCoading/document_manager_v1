// Service Worker for Offline-First Document Processing
// Version 1.0.0

const CACHE_NAME = 'document-manager-v1';
const STATIC_CACHE_NAME = 'document-manager-static-v1';
const DYNAMIC_CACHE_NAME = 'document-manager-dynamic-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/upload',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add critical CSS and JS files
  '/_next/static/css/',
  '/_next/static/chunks/',
];

// Runtime caching patterns
const CACHE_STRATEGIES = {
  // Cache first for static assets
  CACHE_FIRST: 'cache-first',
  // Network first for dynamic content
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate for API calls
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old cache versions
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('document-manager-')) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Handle different request types
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isPageRequest(url)) {
    event.respondWith(handlePageRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Background sync for offline document processing
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-document-sync') {
    event.waitUntil(syncDocumentsToCloud());
  }
  
  if (event.tag === 'process-offline-documents') {
    event.waitUntil(processOfflineDocuments());
  }
});

// Push notifications for processing completion
self.addEventListener('push', (event) => {
  const options = {
    body: 'Your documents have been processed successfully!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2',
    },
    actions: [
      {
        action: 'explore',
        title: 'View Documents',
        icon: '/icons/checkmark.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png',
      },
    ],
  };

  const title = 'Document Processing Complete';
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.message || options.body;
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open dashboard
    event.waitUntil(
      self.clients.openWindow('/dashboard')
    );
  } else if (event.action === 'close') {
    // Do nothing, notification is already closed
  } else {
    // Default action - open app
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Helper functions

function isStaticAsset(url) {
  return url.pathname.includes('/_next/static/') ||
         url.pathname.includes('/icons/') ||
         url.pathname.includes('/screenshots/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.ico');
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') ||
         url.pathname.includes('supabase.co');
}

function isPageRequest(url) {
  return !url.pathname.includes('.') && 
         !url.pathname.startsWith('/api/');
}

async function handleStaticAsset(request) {
  // Cache first strategy for static assets
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('Service Worker: Error fetching static asset:', error);
    return new Response('Asset not available offline', { status: 404 });
  }
}

async function handleAPIRequest(request) {
  // Network first strategy for API requests
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Service Worker: API request failed, trying cache');
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API failures
    return new Response(JSON.stringify({
      error: 'Offline mode',
      message: 'This feature is not available offline',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handlePageRequest(request) {
  // Stale while revalidate for pages
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.status === 200) {
        const cache = caches.open(DYNAMIC_CACHE_NAME);
        cache.then(c => c.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => {
      // Return offline page if available
      return caches.match('/') || 
             new Response('Offline - Page not available', { status: 404 });
    });

  return cachedResponse || fetchPromise;
}

async function handleDynamicRequest(request) {
  // Default handling for other requests
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Content not available offline', { 
      status: 404 
    });
  }
}

async function syncDocumentsToCloud() {
  console.log('Service Worker: Syncing documents to cloud...');
  
  try {
    // This would integrate with your IndexedDB service
    const { hybridStorage } = await import('/js/storage.js');
    const result = await hybridStorage.syncToCloud();
    
    console.log(`Service Worker: Synced ${result.success} documents, ${result.failed} failed`);
    
    if (result.success > 0) {
      // Show success notification
      self.registration.showNotification('Sync Complete', {
        body: `Successfully synced ${result.success} documents to cloud`,
        icon: '/icons/icon-192x192.png',
      });
    }
  } catch (error) {
    console.error('Service Worker: Sync failed:', error);
  }
}

async function processOfflineDocuments() {
  console.log('Service Worker: Processing offline documents...');
  
  try {
    // Get documents from IndexedDB that need processing
    const { indexedDBStorage } = await import('/js/storage.js');
    const pendingDocs = await indexedDBStorage.getDocuments({ status: 'pending' });
    
    for (const doc of pendingDocs.slice(0, 5)) { // Process max 5 at a time
      try {
        // Process document in background
        await processDocumentInBackground(doc);
        
        // Update status
        await indexedDBStorage.updateDocument(doc.id, {
          status: 'processed',
          processing: { progress: 100, stage: 'completed' }
        });
        
      } catch (error) {
        console.error(`Service Worker: Failed to process document ${doc.id}:`, error);
        await indexedDBStorage.updateDocument(doc.id, {
          status: 'failed',
        });
      }
    }
    
    if (pendingDocs.length > 0) {
      // Show completion notification
      self.registration.showNotification('Processing Complete', {
        body: `Processed ${Math.min(pendingDocs.length, 5)} documents offline`,
        icon: '/icons/icon-192x192.png',
      });
    }
  } catch (error) {
    console.error('Service Worker: Background processing failed:', error);
  }
}

async function processDocumentInBackground(doc) {
  // Lightweight document processing that can run in service worker
  // This would be a simplified version of your main processing logic
  
  const file = new File([doc.originalFile], doc.fileName, { type: doc.fileType });
  
  if (doc.fileType.includes('pdf')) {
    // Simple PDF processing - just extract basic metadata
    return {
      text: `PDF processed offline: ${doc.fileName}`,
      metadata: { pages: 1, size: doc.fileSize }
    };
  } else if (doc.fileType.includes('image')) {
    // Simple image processing
    return {
      text: `Image processed offline: ${doc.fileName}`,
      metadata: { format: doc.fileType, size: doc.fileSize }
    };
  }
  
  return {
    text: `Document processed offline: ${doc.fileName}`,
    metadata: { size: doc.fileSize }
  };
}

// Register for background sync when online
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_SYNC') {
    event.waitUntil(
      self.registration.sync.register('background-document-sync')
    );
  }
  
  if (event.data && event.data.type === 'PROCESS_OFFLINE') {
    event.waitUntil(
      self.registration.sync.register('process-offline-documents')
    );
  }
});