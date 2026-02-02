/**
 * Simple Popup Script - Reddit Analytics Scraper
 */

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Popup] Loaded');
  
  // Attach button listeners
  const scrapeBtn = document.getElementById('scrapeBtn');
  const dashboardBtn = document.getElementById('dashboardBtn');
  const exportBtn = document.getElementById('exportBtn');
  const clearBtn = document.getElementById('clearBtn');
  
  if (scrapeBtn) scrapeBtn.addEventListener('click', startScraping);
  if (dashboardBtn) dashboardBtn.addEventListener('click', openDashboard);
  if (exportBtn) exportBtn.addEventListener('click', exportData);
  if (clearBtn) clearBtn.addEventListener('click', clearData);
  
  // Load existing data
  loadStats();
});

/**
 * Start scraping
 */
async function startScraping() {
  console.log('[Popup] Start scraping clicked');
  
  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.textContent = '⏳ Scraping...';
  
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('[Popup] Current URL:', tab.url);
    
    if (!tab.url || !tab.url.includes('reddit.com')) {
      alert('❌ Please go to Reddit first!\n\nExample: reddit.com/r/python');
      if (statusEl) statusEl.textContent = '❌ Not on Reddit';
      return;
    }
    
    // Send message to content script
    console.log('[Popup] Sending scrape message...');
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'scrapePostsPage'
    });
    
    console.log('[Popup] Response:', response);
    
    if (response && response.posts && response.posts.length > 0) {
      // Store data
      const session = {
        data: {
          posts: response.posts,
          pageUrl: response.pageUrl,
          subreddit: response.subreddit
        },
        timestamp: new Date().toISOString()
      };
      
      chrome.storage.local.get(['scrapedData'], (result) => {
        let sessions = result.scrapedData || [];
        sessions.push(session);
        if (sessions.length > 10) sessions = sessions.slice(-10);
        
        chrome.storage.local.set({ scrapedData: sessions }, () => {
          console.log('[Popup] Data saved');
          updateStats(response.posts);
          if (statusEl) statusEl.textContent = '✅ Done! ' + response.posts.length + ' posts';
        });
      });
    } else {
      alert('❌ No posts found. Try a different subreddit.');
      if (statusEl) statusEl.textContent = '❌ No posts';
    }
    
  } catch (error) {
    console.error('[Popup] Error:', error);
    alert('❌ Error: ' + error.message);
    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.textContent = '❌ Error';
  }
}

/**
 * Update stats display
 */
function updateStats(posts) {
  if (!posts || posts.length === 0) return;
  
  const totalPosts = posts.length;
  const avgUpvotes = Math.round(posts.reduce((sum, p) => sum + p.upvotes, 0) / totalPosts);
  const avgComments = Math.round(posts.reduce((sum, p) => sum + p.comments, 0) / totalPosts);
  const uniqueUsers = new Set(posts.map(p => p.author)).size;
  
  const totalEl = document.getElementById('totalPosts');
  const upvotesEl = document.getElementById('avgUpvotes');
  const commentsEl = document.getElementById('avgComments');
  const usersEl = document.getElementById('uniqueUsers');
  
  if (totalEl) totalEl.textContent = totalPosts;
  if (upvotesEl) upvotesEl.textContent = avgUpvotes;
  if (commentsEl) commentsEl.textContent = avgComments;
  if (usersEl) usersEl.textContent = uniqueUsers;
  
  console.log('[Popup] Stats updated:', { totalPosts, avgUpvotes, avgComments, uniqueUsers });
}

/**
 * Load stats from storage
 */
function loadStats() {
  chrome.storage.local.get(['scrapedData'], (result) => {
    if (result.scrapedData && result.scrapedData.length > 0) {
      const latest = result.scrapedData[result.scrapedData.length - 1];
      if (latest.data && latest.data.posts) {
        updateStats(latest.data.posts);
      }
    }
  });
}

/**
 * Open dashboard
 */
function openDashboard() {
  console.log('[Popup] Opening dashboard');
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
}

/**
 * Export data
 */
function exportData() {
  console.log('[Popup] Exporting data');
  
  chrome.storage.local.get(['scrapedData'], (result) => {
    if (!result.scrapedData || result.scrapedData.length === 0) {
      alert('No data to export. Scrape some posts first!');
      return;
    }
    
    const latest = result.scrapedData[result.scrapedData.length - 1];
    const posts = latest.data.posts;
    
    // Download JSON
    const json = JSON.stringify(posts, null, 2);
    download('reddit-posts.json', json);
    
    // Download CSV
    const csv = convertToCSV(posts);
    download('reddit-posts.csv', csv);
    
    alert('✅ Files downloaded!');
  });
}

/**
 * Convert posts to CSV
 */
function convertToCSV(posts) {
  const headers = ['Title', 'Author', 'Upvotes', 'Comments', 'URL'];
  const rows = posts.map(p => [
    `"${p.title.replace(/"/g, '""')}"`,
    p.author,
    p.upvotes,
    p.comments,
    p.postUrl
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Download file
 */
function download(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Clear data
 */
function clearData() {
  if (!confirm('Delete all saved data?')) return;
  
  chrome.storage.local.clear(() => {
    document.getElementById('totalPosts').textContent = '0';
    document.getElementById('avgUpvotes').textContent = '0';
    document.getElementById('avgComments').textContent = '0';
    document.getElementById('uniqueUsers').textContent = '0';
    document.getElementById('status').textContent = '✅ Cleared';
    alert('✅ Data cleared!');
  });
}

console.log('[Popup] Script loaded');
