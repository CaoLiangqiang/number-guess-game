/**
 * 数字对决 Pro - Service Worker
 * 提供离线缓存和更新管理功能
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `number-guess-${CACHE_VERSION}`;

// 核心资源列表 - 这些资源将在安装时缓存
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-48x48.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// 外部CDN资源 - 使用 stale-while-revalidate 策略
const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.loli.net/css2'
];

// ==================== 安装阶段 ====================

self.addEventListener('install', (event) => {
  console.log('[Service Worker] 安装中...');
  
  // 跳过等待，立即激活
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] 缓存核心资源...');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] 核心资源缓存完成');
      })
      .catch((error) => {
        console.error('[Service Worker] 缓存失败:', error);
      })
  );
});

// ==================== 激活阶段 ====================

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] 激活中...');
  
  event.waitUntil(
    // 清理旧版本缓存
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] 激活完成');
        // 立即接管所有客户端
        return self.clients.claim();
      })
  );
});

// ==================== 请求拦截 ====================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }
  
  // 跳过 WebSocket 请求
  if (url.protocol === 'wss:' || url.protocol === 'ws:') {
    return;
  }
  
  // 处理导航请求（页面请求）
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigate(request));
    return;
  }
  
  // 处理 CDN 资源
  if (CDN_ASSETS.some(cdnUrl => url.href.includes(cdnUrl))) {
    event.respondWith(handleCDN(request));
    return;
  }
  
  // 处理图片资源
  if (request.destination === 'image') {
    event.respondWith(handleImage(request));
    return;
  }
  
  // 默认使用 Cache First 策略
  event.respondWith(handleCacheFirst(request));
});

// ==================== 缓存策略处理器 ====================

/**
 * 处理导航请求 - 优先返回缓存，离线时返回离线页面
 */
async function handleNavigate(request) {
  try {
    // 先尝试从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // 后台更新缓存
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone());
            });
          }
        })
        .catch(() => {});
      return cachedResponse;
    }
    
    // 缓存未命中，尝试网络
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response was not ok');
  } catch (error) {
    console.log('[Service Worker] 导航请求失败，返回离线页面');
    // 返回离线页面
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // 如果连离线页面都没有，返回一个简单的错误响应
    return new Response(
      '<h1>离线模式</h1><p>请检查网络连接后重试。</p>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

/**
 * 处理 CDN 资源 - Stale While Revalidate 策略
 */
async function handleCDN(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // 后台更新缓存
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);
  
  // 立即返回缓存（如果有），否则等待网络
  return cachedResponse || fetchPromise;
}

/**
 * 处理图片资源 - Cache First 策略
 */
async function handleImage(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // 图片加载失败，返回一个透明的 1x1 像素
    return new Response(
      new Blob([new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x3b])]),
      { headers: { 'Content-Type': 'image/gif' } }
    );
  }
}

/**
 * 默认 Cache First 策略
 */
async function handleCacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // 后台更新
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
      })
      .catch(() => {});
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] 请求失败:', request.url, error);
    throw error;
  }
}

// ==================== 消息处理 ====================

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

// ==================== 后台同步（可选） ====================

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[Service Worker] 后台同步触发');
    // 可以在这里处理后台同步逻辑
  }
});

// ==================== 推送通知（可选） ====================

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: data.tag || 'default',
      requireInteraction: false
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[Service Worker] 脚本加载完成');
