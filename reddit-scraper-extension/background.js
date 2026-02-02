/**
 * Background Service Worker (Manifest V3)
 * 
 * Handles:
 * - Communication between popup and content scripts
 * - Data storage and caching
 * - Event handling
 */

// Initialize extension on install
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Background Worker] Extension installed/updated:', details.reason);
  
  // Set default storage values
  chrome.storage.local.set({
    scrapedData: [],
    lastScrapeTime: null,
    totalSessions: 0,
    settings: {
      autoScrape: false,
      cacheDuration: 3600 // 1 hour in seconds
    }
  });
});

/**
 * Listen for messages from content scripts or popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background Worker] Message received:', request.action);
  
  if (request.action === 'storeScrapedData') {
    // Store scraped data in local storage
    chrome.storage.local.get(['scrapedData'], (result) => {
      let allData = result.scrapedData || [];
      
      // Add new data with timestamp
      const newEntry = {
        data: request.data,
        timestamp: new Date().toISOString(),
        sessionId: generateSessionId()
      };
      
      allData.push(newEntry);
      
      // Keep only last 10 sessions to avoid storage limits
      if (allData.length > 10) {
        allData = allData.slice(-10);
      }
      
      chrome.storage.local.set({
        scrapedData: allData,
        lastScrapeTime: new Date().toISOString()
      });
      
      sendResponse({
        success: true,
        message: 'Data stored successfully',
        totalSessions: allData.length
      });
    });
    
    return true; // Keep channel open for async response
    
  } else if (request.action === 'getStoredData') {
    chrome.storage.local.get(['scrapedData', 'lastScrapeTime'], (result) => {
      sendResponse({
        data: result.scrapedData || [],
        lastScrapeTime: result.lastScrapeTime || null
      });
    });
    
    return true;
    
  } else if (request.action === 'clearData') {
    chrome.storage.local.set({
      scrapedData: [],
      lastScrapeTime: null
    });
    
    sendResponse({ success: true, message: 'Data cleared' });
  }
});

/**
 * Generate unique session ID
 * @returns {string} Session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

console.log('[Background Worker] Service worker loaded');
