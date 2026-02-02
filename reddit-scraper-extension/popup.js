/**
 * Popup Script
 * Handles user interactions and displays data in the popup window
 */

// DOM Elements - Initialize safely
let scrapeBtn, dashboardBtn, exportBtn, clearBtn, statusEl, lastScrapeEl, postCountEl, spinner;
let loadingBox, errorBox, errorList, totalPostsEl, avgUpvotesEl, avgCommentsEl, uniqueUsersEl;
let includeScrollCheckbox, excludeSponsoredCheckbox;

/**
 * Initialize popup when loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Popup] Popup loaded');
  initializeDOMElements();
  loadStoredData();
  setupEventListeners();
});

/**
 * Initialize all DOM elements safely
 */
function initializeDOMElements() {
  scrapeBtn = document.getElementById('scrapeBtn');
  dashboardBtn = document.getElementById('dashboardBtn');
  exportBtn = document.getElementById('exportBtn');
  clearBtn = document.getElementById('clearBtn');
  statusEl = document.getElementById('status');
  lastScrapeEl = document.getElementById('lastScrape');
  postCountEl = document.getElementById('postCount');
  spinner = document.getElementById('spinner');
  loadingBox = document.getElementById('loadingBox');
  errorBox = document.getElementById('errorBox');
  errorList = document.getElementById('errorList');
  totalPostsEl = document.getElementById('totalPosts');
  avgUpvotesEl = document.getElementById('avgUpvotes');
  avgCommentsEl = document.getElementById('avgComments');
  uniqueUsersEl = document.getElementById('uniqueUsers');
  includeScrollCheckbox = document.getElementById('includeScroll');
  excludeSponsoredCheckbox = document.getElementById('excludeSponsored');
  
  console.log('[Popup] DOM elements initialized');
}

/**
 * Setup event listeners for all buttons
 */
function setupEventListeners() {
  if (scrapeBtn) scrapeBtn.addEventListener('click', handleScrapClick);
  if (dashboardBtn) dashboardBtn.addEventListener('click', handleDashboardClick);
  if (exportBtn) exportBtn.addEventListener('click', handleExportClick);
  if (clearBtn) clearBtn.addEventListener('click', handleClearClick);
  console.log('[Popup] Event listeners attached');
}

/**
 * Handle scrape button click
 */
async function handleScrapClick() {
  console.log('[Popup] Scrape button clicked');
  
  try {
    // Check if on Reddit
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('[Popup] Current tab URL:', tab.url);
    
    if (!tab.url || !tab.url.includes('reddit.com')) {
      alert('⚠️ Please navigate to Reddit first!\n\nExample: reddit.com/r/python');
      updateStatus('Not on Reddit');
      return;
    }
    
    // Show loading state
    updateStatus('Scraping...');
    if (scrapeBtn) scrapeBtn.disabled = true;
    if (spinner) spinner.style.display = 'inline-block';
    if (loadingBox) loadingBox.style.display = 'flex';
    hideError();
    
    console.log('[Popup] Sending message to content script...');
    
    // Send message to content script to scrape
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'scrapePostsPage'
    });
    
    console.log('[Popup] Scrape response:', response);
    
    if (response && response.posts && response.posts.length > 0) {
      // Filter data based on options
      let filteredPosts = response.posts;
      
      if (excludeSponsoredCheckbox && excludeSponsoredCheckbox.checked) {
        filteredPosts = filteredPosts.filter(post => !post.isSponsored);
      }
      
      // Store the data
      await storeScrapedData({
        posts: filteredPosts,
        pageUrl: response.pageUrl,
        pageTitle: response.pageTitle,
        subreddit: response.subreddit,
        totalPostsVisible: response.totalPostsVisible
      });
      
      // Update UI
      updateStats(filteredPosts);
      updateStatus('✅ Complete!');
      if (lastScrapeEl) lastScrapeEl.textContent = new Date().toLocaleTimeString();
      
      // Show errors if any
      if (response.errors && response.errors.length > 0) {
        showError(response.errors);
      }
      
    } else {
      const errorMsg = (response && response.errors) ? response.errors[0] : 'No posts found';
      showError([errorMsg]);
      updateStatus('❌ No posts');
    }
    
  } catch (error) {
    console.error('[Popup] Error during scraping:', error);
    showError([error.message || 'Failed to scrape. Make sure you\'re on a Reddit page']);
    updateStatus('❌ Error');
  } finally {
    if (scrapeBtn) scrapeBtn.disabled = false;
    if (spinner) spinner.style.display = 'none';
    if (loadingBox) loadingBox.style.display = 'none';
  }
}

/**
 * Handle infinite scroll
 */
async function handleInfiniteScroll(tabId) {
  console.log('[Popup] Handling infinite scroll');
  
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'handleScroll'
    });
    
    console.log('[Popup] Scroll response:', response);
    
  } catch (error) {
    console.warn('[Popup] Scroll error:', error);
  }
}

/**
 * Handle dashboard button click
 */
function handleDashboardClick() {
  console.log('[Popup] Dashboard button clicked');
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
}

/**
 * Handle export button click
 */
async function handleExportClick() {
  console.log('[Popup] Export button clicked');
  
  const { data } = await chrome.storage.local.get(['scrapedData']);
  
  if (!data || data.length === 0) {
    showError(['No data to export']);
    return;
  }
  
  // Get the latest scrape
  const latestSession = data[data.length - 1];
  const posts = latestSession.data.posts;
  
  // Create JSON
  const jsonData = JSON.stringify(posts, null, 2);
  
  // Create CSV
  const csvData = postsToCSV(posts);
  
  // Create download links
  downloadFile('reddit-posts.json', jsonData, 'application/json');
  downloadFile('reddit-posts.csv', csvData, 'text/csv');
  
  setStatus('success', 'Data exported');
}

/**
 * Convert posts array to CSV format
 */
function postsToCSV(posts) {
  if (!posts || posts.length === 0) return '';
  
  const headers = [
    'ID', 'Index', 'Title', 'Author', 'Subreddit', 
    'Upvotes', 'Comments', 'URL', 'Timestamp'
  ];
  
  const rows = posts.map(post => [
    post.id,
    post.index,
    `"${post.title.replace(/"/g, '""')}"`,
    post.author,
    post.subreddit,
    post.upvotes,
    post.comments,
    post.postUrl,
    post.timestamp
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csv;
}

/**
 * Download file helper
 */
function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Handle clear button click
 */
async function handleClearClick() {
  if (!confirm('Are you sure you want to clear all data?')) return;
  
  console.log('[Popup] Clearing all data');
  
  chrome.runtime.sendMessage(
    { action: 'clearData' },
    (response) => {
      if (response.success) {
        resetUI();
        setStatus('idle', 'Data cleared');
      }
    }
  );
}

/**
 * Store scraped data via background worker
 */
function storeScrapedData(data) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: 'storeScrapedData', data },
      (response) => {
        if (response.success) {
          console.log('[Popup] Data stored:', response);
          resolve(response);
        } else {
          reject(new Error('Failed to store data'));
        }
      }
    );
  });
}

/**
 * Load stored data and update UI
 */
async function loadStoredData() {
  chrome.storage.local.get(['scrapedData', 'lastScrapeTime'], (result) => {
    if (result.scrapedData && result.scrapedData.length > 0) {
      const latestSession = result.scrapedData[result.scrapedData.length - 1];
      updateStats(latestSession.data.posts);
      
      if (result.lastScrapeTime) {
        lastScrapeEl.textContent = new Date(result.lastScrapeTime).toLocaleTimeString();
      }
    }
  });
}

/**
 * Update statistics display
 */
function updateStats(posts) {
  if (!posts || posts.length === 0) {
    resetUI();
    return;
  }
  
  // Calculate stats
  const totalPosts = posts.length;
  const avgUpvotes = Math.round(posts.reduce((sum, p) => sum + p.upvotes, 0) / totalPosts);
  const avgComments = Math.round(posts.reduce((sum, p) => sum + p.comments, 0) / totalPosts);
  const uniqueUsers = new Set(posts.map(p => p.author)).size;
  
  // Update UI
  totalPostsEl.textContent = totalPosts;
  avgUpvotesEl.textContent = avgUpvotes.toLocaleString();
  avgCommentsEl.textContent = avgComments.toLocaleString();
  uniqueUsersEl.textContent = uniqueUsers;
  postCountEl.textContent = totalPosts;
  
  console.log('[Popup] Stats updated:', {
    totalPosts,
    avgUpvotes,
    avgComments,
    uniqueUsers
  });
}

/**
 * Reset UI to default state
 */
function resetUI() {
  totalPostsEl.textContent = '0';
  avgUpvotesEl.textContent = '0';
  avgCommentsEl.textContent = '0';
  uniqueUsersEl.textContent = '0';
  postCountEl.textContent = '0';
  lastScrapeEl.textContent = 'Never';
}

/**
 * Update status indicator
 */
function updateStatus(message) {
  if (statusEl) {
    statusEl.textContent = message;
  }
  console.log('[Popup] Status:', message);
}

/**
 * Show error messages
 */
function showError(errors) {
  if (!errorBox || !errorList) return;
  errorBox.style.display = 'block';
  errorList.innerHTML = '';
  
  if (Array.isArray(errors)) {
    errors.forEach(error => {
      const li = document.createElement('li');
      li.textContent = error;
      errorList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = errors;
    errorList.appendChild(li);
  }
}

/**
 * Hide error messages
 */
function hideError() {
  if (errorBox) {
    errorBox.style.display = 'none';
  }
  if (errorList) {
    errorList.innerHTML = '';
  }
}

console.log('[Popup] Script loaded');
