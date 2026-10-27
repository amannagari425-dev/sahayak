/**
 * Sahayak (सहायक) - Background Service Worker
 * Manifest V3 Ephemeral Lifecycle & Message Router
 */

// Configure side panel behavior on installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log(`[Sahayak] Extension installed / updated: ${details.reason}`);

  try {
    // Open side panel when the user clicks the extension action icon
    if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
      console.log('[Sahayak] Side panel behavior set: openPanelOnActionClick = true');
    }
  } catch (error) {
    console.warn('[Sahayak] Error setting side panel behavior:', error);
  }
});

// Fallback action click handler in case setPanelBehavior is not supported
chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open && tab.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (err) {
      console.warn('[Sahayak] Error opening side panel on tab click:', err);
    }
  }
});

// Central runtime message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Sahayak SW] Received message:', message.type, 'from:', sender);

  // Ping / health check for side panel connectivity
  if (message.type === 'PING') {
    sendResponse({ status: 'PONG', timestamp: Date.now() });
    return true;
  }

  // Handle get active tab info
  if (message.type === 'GET_ACTIVE_TAB') {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([activeTab]) => {
      sendResponse({ tab: activeTab || null });
    });
    return true; // Keep message channel open for async response
  }

  return false;
});

