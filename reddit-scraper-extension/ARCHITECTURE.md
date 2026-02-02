# Architecture & Technical Implementation

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CHROME BROWSER                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ POPUP INTERFACE (popup.html/js/css)                  │  │
│  │  - User clicks "Start Scraping"                      │  │
│  │  - Displays stats and controls                       │  │
│  │  - Shows quick analytics                            │  │
│  └────────────────────────┬─────────────────────────────┘  │
│                           │                                 │
│                    sendMessage()                            │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ REDDIT PAGE (content-script.js)                      │  │
│  │  - Runs on reddit.com domains                        │  │
│  │  - Scrapes DOM for post data                         │  │
│  │  - Extracts metadata from elements                   │  │
│  │  - Handles infinite scroll                           │  │
│  └────────────────────────┬─────────────────────────────┘  │
│                           │                                 │
│                    sendMessage()                            │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ SERVICE WORKER (background.js)                       │  │
│  │  - Receives scraped data                             │  │
│  │  - Manages storage operations                        │  │
│  │  - Coordinates between tabs                          │  │
│  └────────────────────────┬─────────────────────────────┘  │
│                           │                                 │
│              chrome.storage.local API                       │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ CHROME STORAGE (Local)                               │  │
│  │  - Persists scraped sessions                         │  │
│  │  - Stores user preferences                           │  │
│  │  - Max 10MB per extension                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ DASHBOARD (dashboard.html/js/css)                    │  │
│  │  - Opens in new tab                                  │  │
│  │  - Reads from storage                                │  │
│  │  - Displays charts and tables                        │  │
│  │  - Uses Chart.js for visualization                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Manifest V3 Compliance

### Key Changes from Manifest V2

```json
{
  "manifest_version": 3,  // Changed from 2
  
  // Background pages replaced with service workers
  "background": {
    "service_worker": "background.js"  // Not "scripts"
  },
  
  // Explicit permissions required
  "permissions": [
    "activeTab",
    "scripting",
    "storage"
  ],
  
  // Host permissions separated
  "host_permissions": [
    "https://www.reddit.com/*",
    "https://reddit.com/*"
  ]
}
```

## Component Details

### 1. Content Script (`content-script.js`)

**Purpose**: Runs on Reddit pages, extracts post data from the DOM

**Key Functions**:

```javascript
scrapeRedditPosts()
├─ Finds all post containers
├─ Iterates through each post
└─ Returns { posts[], errors[], metadata }

extractPostData(element)
├─ Extracts title from various selectors
├─ Finds author and subreddit
├─ Parses upvote/comment counts
└─ Returns structured post object

parseVoteCount(voteString)
├─ Handles "1.2K" → 1200
├─ Handles "1.5M" → 1500000
└─ Returns numeric value

handleInfiniteScroll()
├─ Scrolls to page bottom
├─ Waits for new content
└─ Returns new post count
```

**Data Structure**:
```javascript
{
  posts: [
    {
      id: "abc123",
      title: "Post Title",
      author: "username",
      subreddit: "python",
      upvotes: 1500,
      comments: 245,
      postUrl: "https://reddit.com/r/...",
      timestamp: "2024-01-28T10:30:00Z",
      content: "First 200 chars of post...",
      isSponsored: false,
      isPinned: false
    }
  ],
  errors: [],
  timestamp: "2024-01-28T10:30:00Z"
}
```

**Chrome Messaging API**:
```javascript
// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrapePostsPage') {
    const data = scrapeRedditPosts();
    sendResponse(data);  // Send back to popup/background
  }
});
```

### 2. Service Worker (`background.js`)

**Purpose**: Central event handler and data manager

**Responsibilities**:
- Initialize extension on install
- Store/retrieve scraped data
- Clear storage when requested
- Coordinate between pages

**Key Functions**:
```javascript
onInstalled()
└─ Sets default storage values

onMessage('storeScrapedData')
└─ Saves to chrome.storage.local
└─ Keeps last 10 sessions
└─ Returns confirmation

onMessage('getStoredData')
└─ Retrieves all stored sessions
└─ Returns array of data

onMessage('clearData')
└─ Wipes all stored data
└─ Resets timestamps
```

**Storage Structure**:
```javascript
{
  scrapedData: [
    {
      data: { posts: [...], pageUrl, subreddit, ... },
      timestamp: "ISO string",
      sessionId: "session_timestamp_random"
    }
  ],
  lastScrapeTime: "ISO string"
}
```

### 3. Popup (`popup.html` + `popup.js`)

**Purpose**: User interface for extension controls

**Key Functions**:
```javascript
handleScrapClick()
├─ Validates Reddit page
├─ Sends message to content script
├─ Processes response
└─ Updates UI stats

loadStoredData()
├─ Retrieves from storage
├─ Calculates statistics
└─ Updates display

updateStats(posts)
├─ Calculates averages
├─ Counts unique users
└─ Updates stat cards

exportSessionData()
├─ Generates JSON
├─ Generates CSV
└─ Triggers downloads
```

**UI Flow**:
```
User clicks Scrape Button
    ↓
Disable button, show spinner
    ↓
Send message to Reddit tab
    ↓
Wait for content script response
    ↓
Store data via background worker
    ↓
Update stats display
    ↓
Enable button, hide spinner
```

### 4. Dashboard (`dashboard.html` + `dashboard.js`)

**Purpose**: Analytics visualization and detailed analysis

**Key Functions**:
```javascript
loadSessions()
├─ Retrieves all stored sessions
└─ Populates session dropdown

loadSessionData(index)
├─ Gets specific session
├─ Updates all visualizations
└─ Populates tables

updateCharts(posts)
├─ Creates 4 different charts
├─ Uses Chart.js library
└─ Updates on data change

populateTable(posts)
├─ Creates HTML table rows
├─ Adds click handlers
└─ Links to Reddit posts

exportSessionData()
├─ Converts to JSON
├─ Converts to CSV
└─ Triggers browser download
```

**Charts Implemented**:

1. **Engagement Distribution** (Doughnut)
   - Categories: Low, Medium, High, Viral
   - Shows post count in each tier

2. **Top Posts** (Horizontal Bar)
   - Top 5 posts by upvotes
   - Displays upvote counts

3. **Comments Distribution** (Bar)
   - Categories: No, Few, Moderate, Many
   - Shows frequency distribution

4. **Top Users** (Horizontal Bar)
   - Top 5 users by post count
   - Shows user contributions

## Data Flow Sequence

### Scraping Flow

```
┌─────────────┐
│   Popup     │
└──────┬──────┘
       │ User clicks "Scrape"
       │ chrome.tabs.sendMessage()
       ↓
┌─────────────┐
│ Content     │
│ Script      │ scrapeRedditPosts()
│             │ extractPostData() × N
│             │ parseVoteCount()
└──────┬──────┘
       │ sendResponse(scraped data)
       ↓
┌─────────────┐
│   Popup     │ updateStats()
│             │ chrome.runtime.sendMessage()
└──────┬──────┘
       │ action: 'storeScrapedData'
       ↓
┌─────────────┐
│  Background │
│  Service    │ chrome.storage.local.set()
│  Worker     │ Keeps last 10 sessions
└─────────────┘
```

### Dashboard Flow

```
┌────────────────┐
│  Dashboard.js  │
│  loads         │
└────────┬───────┘
         │ loadSessions()
         │ chrome.storage.local.get()
         ↓
┌────────────────┐
│    Storage     │ Returns session list
└────────┬───────┘
         │
         ├─→ Populate dropdown
         │
         ├─→ Load latest session
         │
         ├─→ updateCharts() → Chart.js
         │
         ├─→ populateTable()
         │
         ├─→ updateUserStats()
         │
         └─→ updateMetadata()
```

## DOM Scraping Strategies

### Selector Strategy

Reddit uses data-testid attributes for reliable selection:

```javascript
// Primary selectors with fallbacks
const titleElement = postElement.querySelector(
  'h3, [data-testid="post-title"], a[data-testid="internal-umaami-link"]'
);

// Multiple approaches to extract same data
const upvoteElement = postElement.querySelector(
  '[aria-label*="upvote"], [data-testid*="vote"]'
);
```

### Robustness

**Multi-level fallbacks**:
1. Primary selector (most reliable)
2. Secondary selector (if structure changes)
3. Fallback value (default if not found)
4. Error handling (try-catch blocks)

**Example**:
```javascript
try {
  const author = authorElement?.textContent?.trim() || 'Unknown';
} catch (error) {
  errors.push(`Error extracting author: ${error.message}`);
}
```

## Error Handling

### Graceful Degradation

```javascript
try {
  // Extract post data
  const postData = extractPostData(element, index);
} catch (error) {
  // Don't crash entire scrape
  console.warn(`Post ${index} failed: ${error.message}`);
  errors.push(`Post ${index}: ${error.message}`);
  // Continue to next post
}

// Return partial results
return {
  posts: successfulPosts,
  errors: errors,
  timestamp: new Date().toISOString()
};
```

### User Feedback

- Status badge changes: Idle → Loading → Success/Error
- Error box displays with specific messages
- Loading spinner animates during processing
- Success/failure timestamps recorded

## Performance Considerations

### Optimization Strategies

1. **DOM Queries**: Cache element references
   ```javascript
   const containers = document.querySelectorAll('[data-testid="post-container"]');
   containers.forEach(container => { /* reuse */ });
   ```

2. **Batch Storage**: Store all at once, not incrementally
   ```javascript
   chrome.storage.local.set({ scrapedData: allData }); // Good
   // Not in loop: chrome.storage.local.set(...); // Bad
   ```

3. **Debouncing**: Search/filter operations
   ```javascript
   const debouncedSearch = debounce(filterTable, 300);
   ```

4. **Chart Destruction**: Destroy old instances before creating new ones
   ```javascript
   if (chartInstances.engagement) {
     chartInstances.engagement.destroy();
   }
   chartInstances.engagement = new Chart(...);
   ```

### Storage Limits

- **Total**: 10 MB per extension
- **Session Size**: ~50-200 KB per session (1000 posts)
- **Max Sessions**: Keeps last 10 sessions (~500 KB - 2 MB)
- **Overhead**: ~10% for metadata and structure

## Security Implementation

### Content Security Policy

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'",
    "sandbox": "sandbox allow-scripts allow-same-origin"
  }
}
```

### Safe Practices

✅ **Implemented**:
- No inline scripts (all in separate files)
- No `eval()` or `new Function()`
- No external scripts except Chart.js (integrity check)
- Input validation and sanitization
- Escaped output in HTML

❌ **Never Used**:
- Dynamic code generation
- Unsafe DOM methods (innerHTML for user data)
- Unvalidated external resources
- localStorage for sensitive data

---

**Document Version**: 1.0.0  
**Last Updated**: January 28, 2026
