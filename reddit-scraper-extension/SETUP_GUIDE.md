# Setup Guide & Troubleshooting

## 🚀 Quick Start Guide

### Step 1: Prepare the Extension (2 minutes)

The extension folder structure is ready:
```
reddit-scraper-extension/
├── manifest.json
├── background.js
├── content-script.js
├── popup.html
├── popup.js
├── popup.css
├── dashboard.html
├── dashboard.js
├── dashboard.css
├── README.md
└── ARCHITECTURE.md
```

### Step 2: Load in Chrome (2 minutes)

1. **Open Chrome Extensions Page**
   - Type `chrome://extensions/` in address bar
   - Or: Menu → Settings → Extensions

2. **Enable Developer Mode**
   - Toggle in top-right corner
   - You should see "Load unpacked" button appear

3. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to `/Users/vvndcosta/Desktop/copilot/reddit-scraper-extension`
   - Click "Select Folder"

4. **Verify Installation**
   - Extension appears in your list
   - Icon visible in toolbar (colorful Reddit icon)
   - Click icon to see popup

### Step 3: Test the Extension (5 minutes)

1. **Navigate to Reddit**
   - Go to https://www.reddit.com/r/python/
   - Any subreddit works

2. **Open Extension Popup**
   - Click extension icon in toolbar
   - Popup window appears

3. **Start Scraping**
   - Click "Start Scraping" button
   - Watch for loading spinner
   - Stats should appear after 2-5 seconds

4. **View Dashboard**
   - Click "View Dashboard"
   - New tab opens with full analytics
   - Try exporting data

5. **Test Export**
   - In dashboard, click "📥 Export Session"
   - JSON and CSV files download
   - Check Downloads folder

### ✅ Success Indicators

- ✅ No errors in browser console (F12)
- ✅ Stats display in popup (e.g., "123 posts")
- ✅ Dashboard opens and shows charts
- ✅ Export downloads files
- ✅ Multiple sessions can be compared

---

## 🔧 Installation Troubleshooting

### Issue: "Failed to load extension"

**Possible Causes**:
1. manifest.json syntax error
2. File permissions issue
3. Wrong folder selected

**Solutions**:

```bash
# Check JSON syntax
# Mac/Linux terminal:
python3 -m json.tool manifest.json

# If error found, look for:
# - Missing commas between properties
# - Unclosed quotes or brackets
# - Invalid file paths
```

**Validate file structure**:
```bash
# All these files must exist:
ls -la /Users/vvndcosta/Desktop/copilot/reddit-scraper-extension/

# Should show:
# manifest.json
# background.js
# content-script.js
# popup.html, popup.js, popup.css
# dashboard.html, dashboard.js, dashboard.css
```

**Reset permissions**:
```bash
# Ensure files are readable
chmod 644 /Users/vvndcosta/Desktop/copilot/reddit-scraper-extension/*
```

---

### Issue: Extension loads but popup doesn't work

**Causes**:
1. JavaScript errors in popup.js
2. Content script not injected
3. Storage API issue

**Debug Steps**:

1. **Check popup console**:
   - Right-click extension icon
   - Select "Inspect popup"
   - Look for red errors in Console tab

2. **Check background worker**:
   - chrome://extensions/
   - Find extension, click "Details"
   - Look for "Errors" section

3. **Common errors and fixes**:

```javascript
// Error: "chrome is not defined"
// Fix: Check manifest permissions

// Error: "Cannot read property 'sendMessage' of undefined"
// Fix: Ensure content script is loaded on Reddit page

// Error: "Storage quota exceeded"
// Fix: Click "Clear All" to reset
```

---

## 🐛 Scraping Issues

### Issue: "No posts found" error

**Possible Causes**:
1. Not on Reddit page
2. Posts not loaded yet
3. DOM selectors changed
4. Page requires login

**Solutions**:

```javascript
// Test if on Reddit:
// Type in console (F12):
window.location.hostname.includes('reddit.com')
// Should return: true

// Test if posts exist:
document.querySelectorAll('[data-testid="post-container"]').length
// Should return: number > 0

// If 0, try old selector:
document.querySelectorAll('div[data-testid="post"]').length
```

**Manual fixes**:

1. **Refresh the page**
   - Cmd+R (Mac) or Ctrl+R (Windows)
   - Wait for Reddit to fully load

2. **Try a popular subreddit**
   - https://www.reddit.com/r/all/
   - https://www.reddit.com/r/AskReddit/

3. **Update selectors if Reddit changed UI**
   - Open F12 → Inspector
   - Right-click on a post
   - Select "Inspect"
   - Find data-testid attribute
   - Update in content-script.js

---

### Issue: Wrong upvote/comment counts

**Causes**:
1. Selectors picking wrong elements
2. Vote counts formatted differently (K, M)

**Debug**:
```javascript
// In browser console on Reddit page:
// Find an upvote element:
document.querySelector('[aria-label*="upvote"]')
  .getAttribute('aria-label')
// Shows the exact format

// Check comment count format:
document.querySelector('[data-testid="comments_count"]')
  .textContent
```

**Fix** (if format changed):

Edit `content-script.js`, find `parseVoteCount()` function:

```javascript
function parseVoteCount(voteString) {
  // Add debugging
  console.log('[Reddit Scraper] Raw vote string:', voteString);
  
  const cleanString = voteString.toUpperCase().trim();
  const number = parseFloat(cleanString);
  
  // Handle new formats
  if (cleanString.includes('K')) return number * 1000;
  if (cleanString.includes('M')) return number * 1000000;
  if (cleanString.includes('B')) return number * 1000000000;
  
  return Math.round(number) || 0;
}
```

---

### Issue: Infinite scroll not working

**Causes**:
1. Option not checked
2. Scroll already at bottom
3. No more posts to load

**Solutions**:

1. **Enable the option**:
   - In popup, check "Handle Infinite Scroll"
   - Click "Start Scraping" again

2. **Test scroll manually**:
   - Open Reddit page
   - Scroll to bottom slowly
   - Wait for new posts to load
   - If they don't load, Reddit issue not extension

3. **Debug in console**:
```javascript
// Manually trigger scroll:
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.tabs.sendMessage(tabs[0].id, {action: 'handleScroll'});
});
```

---

## 📊 Dashboard Issues

### Issue: Dashboard shows no data

**Causes**:
1. Haven't scraped yet
2. Data cleared
3. Session expired

**Solutions**:

1. **Scrape data first**:
   - Go to Reddit page
   - Use popup to scrape
   - Then open dashboard

2. **Check stored data**:
   - In popup console:
   ```javascript
   chrome.storage.local.get(['scrapedData'], (result) => {
     console.log('Sessions:', result.scrapedData?.length);
   });
   ```

3. **Reset everything**:
   - Click "Clear All" in popup
   - Reload extension (chrome://extensions/)
   - Scrape again

---

### Issue: Charts not rendering

**Causes**:
1. Chart.js not loaded
2. JavaScript errors
3. Empty data

**Solutions**:

1. **Check Chart.js loaded**:
   - Dashboard → F12 → Console
   - Type: `Chart`
   - Should return Chart constructor

2. **View errors**:
   - F12 → Console tab
   - Look for red error messages
   - Copy error and search for solution

3. **Force refresh charts**:
   - Select different session
   - Select back to original
   - Charts should regenerate

---

### Issue: Export fails

**Causes**:
1. No data to export
2. Browser security
3. File size too large

**Solutions**:

1. **Verify data exists**:
   - Session should show > 0 posts
   - Stats cards should have numbers

2. **Check browser settings**:
   - Downloads folder must be writable
   - No security restrictions
   - JavaScript enabled

3. **Try manual export**:
   - Copy data from table
   - Paste into spreadsheet
   - Save manually

---

## 🔒 Storage & Privacy

### View Stored Data

```javascript
// In any extension popup/dashboard console:
chrome.storage.local.get(null, (result) => {
  console.log('All stored data:', result);
});
```

### Clear All Data

**Method 1: Via Popup**
- Click extension icon
- Click "Clear All" button
- Confirm in popup

**Method 2: Via Code**
```javascript
chrome.storage.local.clear();
```

**Method 3: Via Chrome UI**
- chrome://extensions/
- Find extension
- Click "Details"
- "Storage" section
- Click "Clear data"

---

## ⚠️ Common Errors Reference

| Error | Cause | Solution |
|-------|-------|----------|
| "This page can't be accessed" | Wrong URL | Navigate to reddit.com |
| "Content script not injected" | Manifest issue | Reload extension |
| "Storage quota exceeded" | Too many sessions | Click "Clear All" |
| "Chart is not defined" | Chart.js CDN failed | Check internet, reload |
| "Cannot find popup" | Developer mode off | Toggle in chrome://extensions |
| "Posts array is undefined" | Scraping failed | Check console errors, retry |
| "Extension won't load" | File permissions | chmod files, refresh |
| "Data won't export" | Browser security | Check Downloads folder |

---

## 🎯 Performance Tips

### Optimize Scraping

1. **Narrow your scope**
   - Small subreddit = faster
   - Large subreddit = slower
   - Try r/python before r/all/

2. **One session at a time**
   - Don't open multiple Reddit tabs during scrape
   - Close other extensions (if resource-heavy)

3. **Check your internet**
   - Faster connection = faster scraping
   - Slow connection may timeout

### Dashboard Speed

1. **Limit data**
   - Don't keep 10 large sessions
   - Clear old sessions regularly

2. **Browser resources**
   - Close unnecessary tabs
   - Restart Chrome if sluggish
   - Check available RAM

---

## 📱 Browser Compatibility

### Tested On
- ✅ Chrome 88+
- ✅ Edge 88+ (Chromium)
- ✅ Brave (Chromium)
- ✅ Vivaldi (Chromium)

### Not Compatible
- ❌ Firefox (uses different API)
- ❌ Safari (doesn't support extensions this way)
- ❌ Opera (older versions)

---

## 🆘 Still Having Issues?

### Debug Checklist

- [ ] Chrome version is 88+
- [ ] Developer mode enabled
- [ ] All files present in folder
- [ ] manifest.json has valid JSON
- [ ] No red errors in F12 console
- [ ] Viewing reddit.com page
- [ ] Internet connection stable
- [ ] Storage quota not exceeded

### Last Resort Troubleshooting

```bash
# 1. Remove extension
chrome://extensions/
# Find extension, click "Remove"

# 2. Clear browser cache
chrome://settings/clearBrowserData
# Select all time, clear

# 3. Restart Chrome completely
# Close all Chrome windows
# Reopen Chrome

# 4. Re-add extension
# Repeat installation steps above
```

### Getting Help

If issues persist:

1. **Check browser console (F12)**
   - Right-click extension icon
   - "Inspect popup" or "Inspect background"
   - Note exact error message

2. **Test on different subreddit**
   - Error specific to one subreddit?
   - Works on others?

3. **Review ARCHITECTURE.md**
   - Technical documentation
   - Code flow explanation
   - Data structures

---

## 📚 Additional Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/mv3/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Chart.js Docs](https://www.chartjs.org/docs/latest/)
- [Reddit Terms of Service](https://www.reddit.com/help/useragreement/)

---

**Last Updated**: January 28, 2026  
**Status**: Production Ready v1.0.0
