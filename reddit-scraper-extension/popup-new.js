/**
 * Popup Script - Simplified version
 */

console.log('[Popup] Script loaded');

// Setup buttons
document.getElementById('scrapeBtn')?.addEventListener('click', startScraping);
document.getElementById('dashboardBtn')?.addEventListener('click', openDashboard);
document.getElementById('exportBtn')?.addEventListener('click', exportData);
document.getElementById('clearBtn')?.addEventListener('click', clearData);

// Load stats on startup
loadStats();

async function startScraping() {
  console.log('[Popup] Start scraping clicked');
  
  const status = document.getElementById('status');
  
  try {
    // Get current active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    
    console.log('[Popup] Current tab:', tab.url);
    
    if (!tab || !tab.url || !tab.url.includes('reddit.com')) {
      // If not on Reddit, open a subreddit in a new tab to help the user
      const target = 'https://www.reddit.com/r/python/';
      status.textContent = '🔗 Opening reddit.com/r/python in a new tab...';
      try {
        await chrome.tabs.create({ url: target });
      } catch (err) {
        console.warn('[Popup] Could not open new tab:', err);
      }
      // Inform the user to wait and then click Start Scraping again on the Reddit tab
      alert('Opened reddit.com/r/python in a new tab. Please switch to that tab, wait for the page to load, and click Start Scraping again.');
      return;
    }
    
    status.textContent = '⏳ Scraping...';
    
    // Send message to content script
    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'scrapePostsPage'
      });
      
      console.log('[Popup] Got response:', response);
      
      if (response?.posts?.length > 0) {
        // Save to storage
        const session = {
          data: {
            posts: response.posts,
            pageUrl: response.pageUrl,
            subreddit: response.subreddit
          },
          timestamp: new Date().toISOString()
        };
        
        chrome.storage.local.get(['scrapedData'], (result) => {
          const sessions = (result.scrapedData || []).slice(-9);
          sessions.push(session);
          chrome.storage.local.set({ scrapedData: sessions });
        });
        
        updateStats(response.posts);
        status.textContent = `✅ Got ${response.posts.length} posts!`;
      } else {
        status.textContent = '❌ No posts found';
      }
    } catch (msgError) {
      console.error('[Popup] Message error:', msgError);
      status.textContent = '❌ Content script error';
    }
    
  } catch (error) {
    console.error('[Popup] Error:', error);
    status.textContent = '❌ Error: ' + error.message;
  }
}

function openDashboard() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('dashboard.html')
  });
}

function exportData() {
  chrome.storage.local.get(['scrapedData'], (result) => {
    const data = result.scrapedData || [];
    
    if (data.length === 0) {
      alert('No data to export. Scrape some posts first!');
      return;
    }
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reddit-data-' + Date.now() + '.json';
    a.click();
  });
}

function clearData() {
  if (confirm('Clear all scraped data?')) {
    chrome.storage.local.set({ scrapedData: [] });
    document.getElementById('totalPosts').textContent = '0';
    document.getElementById('avgUpvotes').textContent = '0';
    document.getElementById('avgComments').textContent = '0';
    document.getElementById('uniqueUsers').textContent = '0';
    document.getElementById('status').textContent = 'Cleared!';
  }
}

function loadStats() {
  chrome.storage.local.get(['scrapedData'], (result) => {
    const sessions = result.scrapedData || [];
    
    if (sessions.length === 0) {
      return;
    }
    
    const latestSession = sessions[sessions.length - 1];
    if (latestSession?.data?.posts) {
      updateStats(latestSession.data.posts);
    }
  });
}

function updateStats(posts) {
  if (!posts || posts.length === 0) return;
  
  const totalUpvotes = posts.reduce((sum, p) => sum + (p.upvotes || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments || 0), 0);
  const uniqueAuthors = new Set(posts.map(p => p.author)).size;
  
  document.getElementById('totalPosts').textContent = posts.length;
  document.getElementById('avgUpvotes').textContent = Math.round(totalUpvotes / posts.length);
  document.getElementById('avgComments').textContent = Math.round(totalComments / posts.length);
  document.getElementById('uniqueUsers').textContent = uniqueAuthors;
}
