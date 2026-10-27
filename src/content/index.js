/**
 * Sahayak (सहायक) - Content Script Entry Point
 * Injected into active webpage context
 */

console.log('[Sahayak CS] Content script injected on:', window.location.href);

// Listen for messages from Background Service Worker or Side Panel UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Sahayak CS] Received message:', message.type);

  if (message.type === 'PING_CONTENT_SCRIPT') {
    sendResponse({ status: 'PONG', url: window.location.href, title: document.title });
    return true;
  }

  return false;
});

