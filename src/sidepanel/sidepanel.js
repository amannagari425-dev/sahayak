/**
 * Sahayak (सहायक) - Side Panel Controller
 * Handles active tab state, navigation tabs, language preference, and messaging
 */

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Sahayak UI] Side panel DOM ready');

  // Cache UI elements
  const tabDomainText = document.getElementById('tabDomainText');
  const activeTabBadge = document.getElementById('activeTabBadge');
  const langEnglishBtn = document.getElementById('langEnglish');
  const langHinglishBtn = document.getElementById('langHinglish');
  const navTabs = document.querySelectorAll('.nav-tab');
  const viewPanels = document.querySelectorAll('.view-panel');
  const btnSettings = document.getElementById('btnSettings');
  const btnSummarizePage = document.getElementById('btnSummarizePage');

  // 1. Initialize Active Tab Info
  async function refreshActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        try {
          const urlObj = new URL(tab.url);
          tabDomainText.textContent = urlObj.hostname || 'Local / Internal';
          activeTabBadge.title = `Active: ${tab.title || tab.url}`;
        } catch {
          tabDomainText.textContent = tab.url.slice(0, 20);
        }
      } else {
        tabDomainText.textContent = 'No tab active';
      }
    } catch (err) {
      console.warn('[Sahayak UI] Could not query active tab:', err);
      tabDomainText.textContent = 'Web Page';
    }
  }

  await refreshActiveTab();

  // Listen for tab activation / update events
  if (chrome.tabs && chrome.tabs.onActivated) {
    chrome.tabs.onActivated.addListener(refreshActiveTab);
  }
  if (chrome.tabs && chrome.tabs.onUpdated) {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
      if (changeInfo.status === 'complete') {
        refreshActiveTab();
      }
    });
  }

  // 2. Language Preference Toggle (English <-> Hinglish)
  async function loadLanguagePreference() {
    if (chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get(['preferredLanguage']);
      const currentLang = data.preferredLanguage || 'en';
      setLanguageUI(currentLang);
    }
  }

  function setLanguageUI(lang) {
    if (lang === 'hinglish') {
      langHinglishBtn.classList.add('active');
      langEnglishBtn.classList.remove('active');
    } else {
      langEnglishBtn.classList.add('active');
      langHinglishBtn.classList.remove('active');
    }
  }

  async function updateLanguage(lang) {
    setLanguageUI(lang);
    if (chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ preferredLanguage: lang });
      console.log('[Sahayak UI] Language set to:', lang);
    }
  }

  langEnglishBtn.addEventListener('click', () => updateLanguage('en'));
  langHinglishBtn.addEventListener('click', () => updateLanguage('hinglish'));

  await loadLanguagePreference();

  // 3. Navigation View Switching
  navTabs.forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      const targetId = tabBtn.dataset.target;

      navTabs.forEach(btn => btn.classList.remove('active'));
      tabBtn.classList.add('active');

      viewPanels.forEach(panel => {
        if (panel.id === targetId) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    });
  });

  // 4. Quick Actions / Buttons Hook
  btnSettings.addEventListener('click', () => {
    console.log('[Sahayak UI] Settings clicked (Settings modal implemented in Step 1.2)');
    alert('Sahayak Settings: API keys configuration will open here in Step 1.2.');
  });

  btnSummarizePage.addEventListener('click', async () => {
    console.log('[Sahayak UI] Summarize requested (Content extraction connects in Step 1.4)');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    alert(`Ready to summarise: ${tab?.title || 'active page'}\n(Full Gemini distillation activates in Steps 1.2 - 1.4).`);
  });

  // 5. Test Background Service Worker Connectivity (PING)
  chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('[Sahayak UI] Background SW not responding:', chrome.runtime.lastError.message);
    } else {
      console.log('[Sahayak UI] Background SW ping response:', response);
    }
  });
});

