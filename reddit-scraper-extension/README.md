# Reddit Analytics Scraper - Chrome Extension

A powerful Chrome extension for scraping Reddit posts and generating comprehensive analytics with beautiful visualizations.

## 🎯 Overview

This extension allows you to:
- **Scrape Reddit posts** from any subreddit with complete data extraction
- **Analyze engagement metrics** including upvotes, comments, and user activity
- **View interactive dashboards** with charts and statistics
- **Export data** as JSON or CSV for further analysis
- **Handle infinite scroll** to capture more posts

## ✨ Features

### Phase 1: Data Extraction ✅
- Extracts complete post metadata from Reddit pages
- Captures title, author, upvotes, comments, timestamps, and URLs
- Handles dynamic content and modern Reddit UI
- Error handling and validation for robust scraping
- Support for both old and new Reddit interfaces

### Phase 2: Content Scripts ✅
- Manifest V3 compliant content scripts
- Injects scraper into Reddit pages automatically
- Uses message passing for secure communication
- Respects Reddit's DOM structure changes

### Phase 3: Analytics Engine ✅
- Real-time statistics calculation
- Engagement metrics analysis
- User activity tracking
- Post ranking and sorting

### Phase 4: Dashboard ✅
- Interactive visualization with Chart.js
- Multiple chart types (doughnut, bar, line)
- Detailed post table with search and filter
- User statistics and activity heatmaps
- Session management for multiple scrapes

### Bonus Features ✅
- CSV and JSON export functionality
- Infinite scroll support
- Rescan capability
- Data caching and session history
- Multiple session management

## 📋 Data Extracted

Each post entry includes:
- **ID**: Unique post identifier
- **Title**: Post heading
- **Author**: Reddit username of the poster
- **Subreddit**: Community name
- **Upvotes**: Vote count
- **Comments**: Comment count
- **URL**: Direct link to post
- **Timestamp**: Post creation time
- **Content**: Brief post content (first 200 chars)
- **Sponsored**: Sponsored post flag
- **Pinned**: Pinned post flag

## 🚀 Installation

### Requirements
- Google Chrome (Version 88+)
- Unix/Linux/macOS terminal (for local setup)

### Setup Steps

1. **Clone or Download the Extension**
   ```bash
   cd /path/to/extension
   ```

2. **Open Chrome Extensions Page**
   - Go to: `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)

3. **Load Extension**
   - Click "Load unpacked"
   - Select the `reddit-scraper-extension` folder
   - Extension will appear in your extensions list

4. **Verify Installation**
   - Click the extension icon in your toolbar
   - You should see the Reddit Analytics popup

## 📖 How to Use

### Basic Scraping

1. **Navigate to Reddit**
   - Go to any subreddit or Reddit page
   - E.g., https://www.reddit.com/r/python/

2. **Open Extension Popup**
   - Click the extension icon in your toolbar
   - The popup will open with control buttons

3. **Start Scraping**
   - Click **"Start Scraping"** button
   - Wait for the extraction to complete (usually 2-5 seconds)
   - You'll see statistics appear in the popup

4. **Handle Options**
   - Check **"Handle Infinite Scroll"** to load more posts
   - Check **"Exclude Sponsored Posts"** to filter ads

5. **View Dashboard**
   - Click **"View Dashboard"** to open analytics
   - Explore interactive charts and statistics

### Exporting Data

1. **Export from Popup**
   - Click **"Export Data"** button
   - Files download automatically:
     - `reddit-posts.json` - Full data in JSON format
     - `reddit-posts.csv` - Spreadsheet format

2. **Export from Dashboard**
   - Select session from dropdown
   - Click **"📥 Export Session"**
   - Data downloads in both formats

### Managing Sessions

- Extension keeps last **10 scraping sessions**
- Select different sessions from dropdown in dashboard
- Sessions include timestamp, URL, and all metrics
- Clear all data with **"Clear All"** button in popup

## 🏗️ Architecture

### Project Structure
```
reddit-scraper-extension/
├── manifest.json              # Extension configuration (Manifest V3)
├── background.js              # Service worker (event handling, storage)
├── content-script.js          # DOM scraper (runs on Reddit pages)
├── popup.html                 # Popup UI
├── popup.js                   # Popup logic
├── popup.css                  # Popup styling
├── dashboard.html             # Analytics dashboard
├── dashboard.js               # Dashboard logic
├── dashboard.css              # Dashboard styling
└── README.md                  # This file
```

### Data Flow
```
User clicks "Start Scraping"
    ↓
Popup.js sends message to content script
    ↓
Content-script.js scrapes Reddit DOM
    ↓
Returns post data to popup.js
    ↓
Popup.js sends to background.js for storage
    ↓
Chrome Storage API saves data
    ↓
Dashboard.js reads and visualizes
```

### Communication Protocol

**Manifest V3 Message Passing:**
```javascript
// Popup → Content Script
chrome.tabs.sendMessage(tabId, { action: 'scrapePostsPage' })

// Popup/Content → Background
chrome.runtime.sendMessage({ action: 'storeScrapedData', data: {...} })
```

## 🔧 Technical Details

### Manifest V3 Features Used
- ✅ `permissions`: ActiveTab, Scripting, Storage
- ✅ `host_permissions`: Reddit.com domains
- ✅ `background.service_worker`: Replaces background.js
- ✅ `content_scripts`: Runs on specified URLs
- ✅ `action.default_popup`: Extension popup

### DOM Selectors
- Posts: `[data-testid="post-container"]`
- Titles: `h3`, `[data-testid="post-title"]`
- Authors: `[data-testid="post_author_link"]`
- Upvotes: `[aria-label*="upvote"]`
- Comments: `[data-testid="comments_count"]`

### Storage
- **Local Storage**: Uses `chrome.storage.local`
- **Limit**: 10 MB per extension
- **Sessions**: Stores up to 10 session snapshots
- **Auto-expiry**: Sessions older than 24 hours

## 🎨 UI Components

### Popup
- **Quick Stats Cards**: Shows TotalPosts, AvgUpvotes, AvgComments, UniqueUsers
- **Control Buttons**: Scrape, Dashboard, Export, Clear
- **Options Panel**: Infinite scroll, exclude sponsored
- **Status Indicator**: Real-time scraping status

### Dashboard
- **Summary Cards**: Key metrics at a glance
- **Interactive Charts**: 
  - Engagement Distribution (doughnut)
  - Top Posts (bar chart)
  - Comments Distribution (bar chart)
  - Top Users (horizontal bar)
- **Posts Table**: Searchable, sortable, linked posts
- **User Cards**: Top contributors with stats
- **Session Management**: Select from history

## ⚙️ Configuration

### Browser Settings
No additional configuration needed. Extension works out of the box after installation.

### Optional: Chrome Policies
For enterprise deployments, you can set Chrome policies via:
- Windows: Registry settings
- macOS: `/Library/Preferences/com.google.Chrome.plist`
- Linux: `~/.config/google-chrome/Default/Preferences`

## 🐛 Troubleshooting

### Issue: "Content script not loaded"
**Solution**: 
- Refresh the Reddit page (Cmd+R or Ctrl+R)
- Reload extension (chrome://extensions/)
- Clear extension cache: Storage → Clear All Data

### Issue: "No posts found"
**Solution**:
- Ensure you're on a Reddit post page
- Wait for Reddit to fully load
- Try a different subreddit
- Check browser console for errors (F12)

### Issue: "Extension popup crashes"
**Solution**:
- Clear storage: Click "Clear All" in popup
- Disable and re-enable extension
- Reinstall extension

### Issue: "Charts not displaying"
**Solution**:
- Enable JavaScript (usually default)
- Clear browser cache
- Try different session
- Check if data was actually scraped

## 📊 Analytics Explained

### Metrics

**Engagement Distribution**
- Low: < 100 upvotes
- Medium: 100-500 upvotes  
- High: 500-2000 upvotes
- Viral: 2000+ upvotes

**Comment Categories**
- No Comments: 0 comments
- Few: 1-9 comments
- Moderate: 10-49 comments
- Many: 50+ comments

**User Statistics**
- Posts per user
- Average upvotes per post
- Average comments per post
- Total engagement

## 🔒 Privacy & Security

### Data Privacy
- ✅ All scraping happens **locally** on your device
- ✅ No data sent to external servers
- ✅ No user tracking or analytics
- ✅ Extension doesn't require internet except for Reddit

### Security
- ✅ Content Security Policy implemented
- ✅ No eval() or dynamic code execution
- ✅ Limited permissions requested
- ✅ Chrome Security Policy compliant

## ⚖️ Legal & Ethical Considerations

### Regarding Reddit ToS
- This extension respects Reddit's robots.txt
- Uses public, accessible data only
- No authentication data harvesting
- Recommended for **personal research only**

### Ethical Usage
- ✅ Personal research and analysis
- ✅ Academic projects
- ✅ Content audits and moderation
- ❌ Commercial republishing without permission
- ❌ Creating competing services
- ❌ Aggressive automated scraping

### Rate Limiting
- Extension implements reasonable delays
- Doesn't make excessive requests
- Works with Reddit's natural page loading

## 🚧 Known Limitations

1. **Dynamic Content**: May not capture all comments from live threads
2. **Page Load**: Only captures posts visible on current page
3. **Authentication**: Cannot scrape private/NSFW subreddits
4. **Rate Limiting**: Reddit may rate-limit after many rapid scrapes
5. **Reddit Updates**: DOM changes may break selectors temporarily
6. **Storage**: Limited to 10 MB browser storage

## 🔄 Future Enhancements

- [ ] Scheduled automatic scraping
- [ ] Advanced filtering and search
- [ ] Data trending analysis
- [ ] Sentiment analysis of comments
- [ ] Export to Google Sheets
- [ ] Real-time alerts for trending posts
- [ ] Multi-subreddit scraping
- [ ] Historical data comparison

## 📝 Development

### Local Development

1. **Edit source files** in `reddit-scraper-extension/`
2. **Reload extension**:
   - Go to chrome://extensions/
   - Click reload button (circular arrow)
3. **Test changes**:
   - Navigate to Reddit
   - Open extension and test functionality

### Debugging

- **Console Logs**: Press F12 → Console tab
- **Extension Logs**: chrome://extensions/ → Details → Errors
- **Storage Inspection**: Chrome DevTools → Application → Storage

### Modifying Selectors

If Reddit updates their DOM, update selectors in `content-script.js`:

```javascript
// In extractPostData() function
const titleElement = postElement.querySelector('h3, [data-testid="post-title"]');
```

## 📄 License

This extension is provided as-is for educational purposes.

## 🤝 Contributing

For improvements or bug reports:
1. Test thoroughly before suggesting changes
2. Document any new features
3. Ensure compatibility with Reddit's current UI
4. Follow the existing code style

## 📞 Support

### Getting Help
- Check troubleshooting section above
- Review console logs (F12)
- Check Reddit's current DOM structure
- Test with different subreddits

### Reporting Issues
- Note exact error message
- Include subreddit tested
- Provide browser version (chrome://version/)
- Check if issue persists after reload

## 🔗 Resources

- [Manifest V3 Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)
- [Reddit API Documentation](https://www.reddit.com/dev/api)
- [Chart.js Documentation](https://www.chartjs.org/)

---

**Version**: 1.0.0  
**Last Updated**: January 28, 2026  
**Compatibility**: Chrome 88+

Made with ❤️ for Reddit analytics enthusiasts
