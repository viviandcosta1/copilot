# QUICK REFERENCE GUIDE

## 📦 Extension Files Overview

### Essential Files (Core Functionality)

| File | Purpose | Size |
|------|---------|------|
| `manifest.json` | Extension configuration & permissions | Core |
| `content-script.js` | Scrapes Reddit posts from DOM | Core |
| `background.js` | Service worker for data management | Core |
| `popup.html` | User interface for scraping | UI |
| `popup.js` | Popup logic & event handling | UI |
| `popup.css` | Popup styling | UI |
| `dashboard.html` | Analytics dashboard interface | UI |
| `dashboard.js` | Dashboard charts & visualization | UI |
| `dashboard.css` | Dashboard styling | UI |

### Documentation

| File | Content |
|------|---------|
| `README.md` | Complete user guide & features |
| `ARCHITECTURE.md` | Technical architecture & code details |
| `SETUP_GUIDE.md` | Installation & troubleshooting |
| `PROJECT_SUMMARY.md` | Project overview & deliverables |
| `.gitignore` | Git configuration |

---

## 🚀 Installation (30 seconds)

```
1. Go to: chrome://extensions/
2. Toggle: Developer Mode (top-right)
3. Click: "Load unpacked"
4. Select: reddit-scraper-extension folder
5. Done! Click extension icon to test
```

---

## 💡 Usage Flow

### Basic Workflow

```
1. Go to any Reddit subreddit
2. Click extension icon (popup opens)
3. Click "Start Scraping" button
4. Wait for data (2-5 seconds)
5. See stats in popup
6. Click "View Dashboard" for full analytics
7. Click "Export Data" to download files
```

### Keyboard Shortcuts

None currently, but you can:
- Right-click extension → "Inspect popup" for debugging
- Press F12 on Reddit page → Console to run manual queries

---

## 🔑 Key Functions Reference

### Content Script (`content-script.js`)

```javascript
scrapeRedditPosts()              // Main scraping function
extractPostData(element)          // Extracts single post
parseVoteCount(voteString)       // Converts "1.2K" to 1200
handleInfiniteScroll()           // Loads more posts
```

### Popup (`popup.js`)

```javascript
handleScrapClick()               // Start scraping
loadStoredData()                 // Load previous sessions
updateStats(posts)               // Update stat cards
exportSessionData()              // Download JSON/CSV
```

### Dashboard (`dashboard.js`)

```javascript
loadSessions()                   // Load all sessions
loadSessionData(index)           // Load specific session
updateCharts(posts)              // Render all charts
populateTable(posts)             // Fill data table
exportSessionData()              // Export current session
```

### Background Worker (`background.js`)

```javascript
chrome.runtime.onInstalled      // Extension init
chrome.runtime.onMessage        // Handle messages
chrome.storage.local.set()      // Save data
generateSessionId()             // Create unique IDs
```

---

## 📊 Data Structure

### Post Object
```javascript
{
  id: String,              // Unique post ID
  title: String,           // Post title
  author: String,          // Username
  subreddit: String,       // Subreddit name
  upvotes: Number,         // Vote count
  comments: Number,        // Comment count
  postUrl: String,         // Reddit link
  timestamp: String,       // ISO datetime
  content: String,         // Preview text
  isSponsored: Boolean,    // Ad flag
  isPinned: Boolean        // Pinned flag
}
```

### Session Object
```javascript
{
  data: {
    posts: [],           // Array of posts
    pageUrl: String,     // Source page
    subreddit: String,   // Subreddit
    pageTitle: String    // Page title
  },
  timestamp: String,     // Session time
  sessionId: String      // Unique ID
}
```

---

## 🎨 UI Components

### Popup Interface
- **Stats Cards** (4): Shows key metrics
- **Control Buttons** (4): Scrape, Dashboard, Export, Clear
- **Options Panel** (2): Toggle options
- **Status Badge**: Current state
- **Error Box**: Shows errors if any

### Dashboard
- **Summary Cards** (4): High-level metrics
- **Charts** (4): Data visualizations
- **Posts Table**: Detailed list with search
- **User Cards** (10): Top contributors
- **Metadata**: Session information

---

## 🔧 Common Customizations

### Change Scraping Selectors

Edit `content-script.js`, find `extractPostData()`:

```javascript
// Old selector
const titleElement = postElement.querySelector('h3');

// New selector if Reddit changes UI
const titleElement = postElement.querySelector('[data-testid="post-title"]');
```

### Adjust Vote Parsing

Edit `content-script.js`, find `parseVoteCount()`:

```javascript
// Add new format handling
if (cleanString.includes('T')) return number * 1000000000000;
```

### Change Chart Colors

Edit `dashboard.css`, find `:root` section:

```css
--primary: #ff4500;      /* Orange */
--secondary: #0079d3;    /* Blue */
--success: #28a745;      /* Green */
```

### Modify Storage Limit

Edit `background.js`, find session management:

```javascript
// Keep last 20 sessions instead of 10
if (allData.length > 20) {
  allData = allData.slice(-20);
}
```

---

## 🐛 Quick Debugging

### Browser Console (F12)

```javascript
// Check if on Reddit
window.location.hostname.includes('reddit.com')

// Count posts visible
document.querySelectorAll('[data-testid="post-container"]').length

// View stored data
chrome.storage.local.get(null, r => console.log(r))

// Clear all storage
chrome.storage.local.clear()

// Manually scrape (in Reddit page console)
chrome.tabs.query({active:true,currentWindow:true}, t => {
  chrome.tabs.sendMessage(t[0].id, {action:'scrapePostsPage'}, r => console.log(r))
})
```

### Check Extension Logs

```
1. chrome://extensions/
2. Click "Details" on extension
3. Look for "Errors" section
4. Or right-click icon → "Inspect popup"
```

---

## ⚡ Performance Tips

### Faster Scraping
- Use smaller subreddits first
- Close other chrome tabs
- Check internet speed
- Disable other extensions temporarily

### Optimize Dashboard
- Keep only recent sessions (clear old ones)
- Don't export huge datasets
- Restart Chrome if sluggish
- Use Chrome's built-in task manager

---

## 📱 Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ | Full support (88+) |
| Edge | ✅ | Chromium-based |
| Brave | ✅ | Chromium-based |
| Vivaldi | ✅ | Chromium-based |
| Firefox | ❌ | Different API |
| Safari | ❌ | Doesn't support |

---

## 🔐 Security Checklist

- ✅ No external API calls
- ✅ No user data collection
- ✅ No ads or tracking
- ✅ No localStorage (uses storage API)
- ✅ Valid Content Security Policy
- ✅ Limited permissions requested
- ✅ Safe DOM manipulation

---

## 📚 Documentation Map

```
README.md
├─ Overview & Features
├─ Installation Steps
├─ Usage Guide
├─ Data Dictionary
├─ Technical Stack
└─ FAQ

ARCHITECTURE.md
├─ System Design
├─ Component Details
├─ Data Flow
├─ DOM Strategies
├─ Error Handling
└─ Performance

SETUP_GUIDE.md
├─ Quick Start (3 steps)
├─ Detailed Installation
├─ Testing Procedures
├─ Troubleshooting by Issue
├─ Error Reference
└─ Debug Checklist

PROJECT_SUMMARY.md
├─ Deliverables Checklist
├─ Feature Summary
├─ Tech Stack
├─ Analytics Capabilities
├─ Learning Outcomes
└─ Future Ideas

QUICK_REFERENCE.md (This File)
├─ File Overview
├─ Installation
├─ Usage Flow
├─ Code Reference
└─ Debugging Tips
```

---

## 🆘 SOS (Stuck on Scraping)

**Extension won't scrape?**

1. Check: Are you on reddit.com? (address bar)
2. Check: Extension icon visible? (toolbar)
3. Check: Popup opens? (click icon)
4. Check: Console errors? (F12 → Console)
5. Try: Refresh Reddit page (Cmd+R)
6. Try: Reload extension (chrome://extensions → reload)
7. Try: Different subreddit (test on r/all)

**Still stuck?**
- Read SETUP_GUIDE.md "Troubleshooting" section
- Check console errors exactly
- Try clearing storage → re-scraping
- Last resort: Uninstall & reinstall extension

---

## 🎯 Next Steps

### For Users
1. Install extension
2. Go to Reddit
3. Click "Start Scraping"
4. View dashboard
5. Export data

### For Developers
1. Review code in editor
2. Check ARCHITECTURE.md for design
3. Modify selectors as needed
4. Test in Developer Mode
5. Deploy to production

### For Learning
1. Read all documentation
2. Study code side-by-side with docs
3. Modify and experiment
4. Check browser console frequently
5. Understand each component

---

## 📞 Quick Links

- [Chrome Extensions Docs](https://developer.chrome.com/docs/extensions/mv3/)
- [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Chart.js](https://www.chartjs.org/)
- [Reddit ToS](https://www.reddit.com/help/useragreement/)

---

## ✅ Pre-Submission Checklist

- [ ] All files present (14 files total)
- [ ] manifest.json valid JSON
- [ ] No console errors when running
- [ ] Popup appears and works
- [ ] Scraping extracts data
- [ ] Dashboard opens and shows charts
- [ ] Export downloads files
- [ ] README is comprehensive
- [ ] ARCHITECTURE.md explains design
- [ ] SETUP_GUIDE.md has troubleshooting
- [ ] Code is well-commented
- [ ] No hardcoded credentials
- [ ] Ready for GitHub upload

---

**Version**: 1.0.0  
**Status**: Production Ready ✅  
**Last Updated**: January 28, 2026
