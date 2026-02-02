/**
 * Content Script - Reddit Scraper v3
 * Handles modern Reddit with shreddit-post web components
 */

console.log('[Scraper] Loaded at', window.location.href);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  console.log('[Scraper] Got message:', msg.action);
  
  if (msg.action === 'scrapePostsPage') {
    const posts = findAndExtractPosts();
    console.log('[Scraper] Returning', posts.length, 'posts');
    respond({
      success: true,
      posts: posts,
      pageUrl: window.location.href,
      subreddit: extractSubreddit(),
      timestamp: new Date().toISOString()
    });
  }
  
  return true;
});

function findAndExtractPosts() {
  console.log('[Scraper] === STARTING SCRAPE ===');
  
  // Try finding posts with different selectors
  let containers = [];
  
  // Option 1: shreddit-post web components (modern Reddit)
  let elements = document.querySelectorAll('shreddit-post');
  console.log('[Scraper] shreddit-post elements:', elements.length);
  if (elements.length > 0) {
    containers = Array.from(elements);
  }
  
  // Option 2: data-testid="post-container"
  if (containers.length === 0) {
    elements = document.querySelectorAll('[data-testid="post-container"]');
    console.log('[Scraper] [data-testid="post-container"]:', elements.length);
    if (elements.length > 0) {
      containers = Array.from(elements);
    }
  }
  
  // Option 3: article elements
  if (containers.length === 0) {
    elements = document.querySelectorAll('article');
    console.log('[Scraper] article elements:', elements.length);
    if (elements.length > 0) {
      containers = Array.from(elements);
    }
  }
  
  // Option 4: Look for h3 tags (post titles) and get their closest container
  if (containers.length === 0) {
    const h3s = document.querySelectorAll('h3');
    console.log('[Scraper] h3 elements:', h3s.length);
    if (h3s.length > 0) {
      h3s.forEach(h3 => {
        // Find the closest parent that looks like a post container
        let parent = h3.closest('[data-testid="post-container"]') || 
                     h3.closest('article') ||
                     h3.closest('shreddit-post');
        if (parent) containers.push(parent);
      });
      console.log('[Scraper] Found containers from h3 parents:', containers.length);
    }
  }
  
  if (containers.length === 0) {
    console.error('[Scraper] NO CONTAINERS FOUND');
    logPageInfo();
    return [];
  }
  
  console.log('[Scraper] Processing', containers.length, 'containers');
  
  const posts = [];
  containers.forEach((container, idx) => {
    try {
      const post = extractPostData(container);
      if (post.title && post.title.trim().length > 0) {
        console.log('[Scraper]   Post', idx, ':', post.title.substring(0, 40) + '...');
        posts.push(post);
      }
    } catch (err) {
      console.warn('[Scraper]   Error on post', idx, ':', err.message);
    }
  });
  
  console.log('[Scraper] === SCRAPE COMPLETE: Got', posts.length, 'posts ===');
  return posts;
}

function extractPostData(container) {
  const post = {
    title: '',
    author: '',
    subreddit: '',
    upvotes: 0,
    comments: 0,
    url: ''
  };
  
  try {
    // TITLE: Look for h3 or post-title attribute
    let titleElem = container.querySelector('h3');
    if (titleElem) {
      post.title = titleElem.textContent.trim();
    } else if (container.getAttribute) {
      post.title = container.getAttribute('post-title') || 
                   container.getAttribute('title') || '';
    }
    
    // TITLE from link if h3 didn't work
    if (!post.title) {
      const link = container.querySelector('a[href*="/comments/"]');
      if (link) post.title = link.textContent.trim();
    }
    
    // URL: Look for comment link
    const commentLink = container.querySelector('a[href*="/comments/"]');
    if (commentLink) {
      post.url = commentLink.href;
    }
    
    // AUTHOR: Look for author link or attribute
    let authorElem = container.querySelector('[data-testid="post_author_link"]');
    if (authorElem) {
      post.author = authorElem.textContent.trim();
    } else {
      const userLink = container.querySelector('a[href*="/user/"]');
      if (userLink) post.author = userLink.textContent.trim();
    }
    
    // SUBREDDIT: Look for subreddit link or extract from URL
    let subElem = container.querySelector('[data-testid="subreddit_link"]');
    if (subElem) {
      post.subreddit = subElem.textContent.trim().replace(/^r\//, '');
    } else {
      post.subreddit = extractSubreddit();
    }
    
    // UPVOTES: Look for vote count
    const voteElem = container.querySelector('[aria-label*="upvote"]') ||
                     container.querySelector('[aria-label*="points"]');
    if (voteElem) {
      const label = voteElem.getAttribute('aria-label') || '';
      post.upvotes = parseVotes(label);
    }
    
    // COMMENTS: Look for comment count
    const commentElem = container.querySelector('[aria-label*="comment"]');
    if (commentElem) {
      const label = commentElem.getAttribute('aria-label') || '';
      post.comments = parseVotes(label);
    }
    
    return post;
  } catch (err) {
    console.warn('[Scraper] Extract error:', err);
    return post;
  }
}

function parseVotes(str) {
  if (!str) return 0;
  const match = String(str).match(/(\d+\.?\d*)\s*([KMB]?)/i);
  if (!match) return 0;
  
  let num = parseFloat(match[1]);
  const suffix = (match[2] || '').toUpperCase();
  
  if (suffix === 'K') num *= 1000;
  else if (suffix === 'M') num *= 1000000;
  else if (suffix === 'B') num *= 1000000000;
  
  return Math.round(num);
}

function extractSubreddit() {
  const match = window.location.pathname.match(/\/r\/([a-z0-9_]+)/i);
  return match ? match[1] : 'unknown';
}

function logPageInfo() {
  console.log('[Scraper] PAGE DIAGNOSTICS:');
  console.log('[Scraper]   shreddit-post:', document.querySelectorAll('shreddit-post').length);
  console.log('[Scraper]   article:', document.querySelectorAll('article').length);
  console.log('[Scraper]   h3:', document.querySelectorAll('h3').length);
  console.log('[Scraper]   [data-testid="post-container"]:', document.querySelectorAll('[data-testid="post-container"]').length);
  console.log('[Scraper]   All [data-testid]:', document.querySelectorAll('[data-testid]').length);
  
  // Sample some data-testid values
  const testids = new Set();
  document.querySelectorAll('[data-testid]').forEach(el => {
    const testid = el.getAttribute('data-testid');
    if (testids.size < 5) testids.add(testid);
  });
  console.log('[Scraper]   Sample testids:', Array.from(testids));
}

console.log('[Scraper] Ready');
