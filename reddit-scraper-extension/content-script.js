/**
 * Content Script - Reddit Scraper (Rewritten)
 */

console.log('[Scraper] Content script loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Scraper] Received:', request.action);
  
  if (request.action === 'scrapePostsPage') {
    // If the sender requests an auto-scroll to load more posts first,
    // perform that before extracting posts.
    (async () => {
      try {
        if (request.includeScroll) {
          await handleScroll();
        }

        const posts = scrapeAllPosts();
        console.log(`[Scraper] Found ${posts.length} posts`);
        sendResponse({
          success: true,
          posts: posts,
          pageUrl: window.location.href,
          subreddit: getSubreddit(),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('[Scraper] Error:', error);
        sendResponse({
          success: false,
          posts: [],
          error: error.message
        });
      }
    })();

    return true; // indicate async response
  }

  // Handle programmatic scrolling requests separately
  if (request.action === 'handleScroll') {
    (async () => {
      try {
        const result = await handleScroll(request.maxScrolls || 10, request.delay || 1200);
        sendResponse({ success: true, result });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();

    return true;
  }
});

function scrapeAllPosts() {
  const posts = [];
  let postElements = null;
  
  // Strategy 1: data-testid="post-container"
  postElements = document.querySelectorAll('[data-testid="post-container"]');
  console.log('[Scraper] Strategy 1 found:', postElements.length);
  
  // Strategy 2: article tags
  if (postElements.length === 0) {
    postElements = document.querySelectorAll('article');
    console.log('[Scraper] Strategy 2 found:', postElements.length);
  }
  
  // Strategy 3: divs with role
  if (postElements.length === 0) {
    postElements = document.querySelectorAll('div[role="presentation"]');
    console.log('[Scraper] Strategy 3 found:', postElements.length);
  }
  
  // Strategy 4: Look for clickable divs that contain post structure
  if (postElements.length === 0) {
    postElements = document.querySelectorAll('div[class*="Post"], div[class*="post"]');
    console.log('[Scraper] Strategy 4 found:', postElements.length);
  }
  
  if (postElements.length === 0) {
    console.warn('[Scraper] No posts found!');
    return [];
  }
  
  postElements.forEach((elem, idx) => {
    try {
      const post = extractPost(elem);
      if (post.title && post.title.length > 2) {
        posts.push(post);
      }
    } catch (e) {
      console.warn('[Scraper] Error on post', idx);
    }
  });
  
  return posts;
}

function extractPost(elem) {
  const post = {
    title: '',
    author: '',
    subreddit: '',
    upvotes: 0,
    comments: 0,
    url: ''
  };
  
  // GET TITLE
  let titleEl = elem.querySelector('h3');
  if (titleEl) {
    post.title = titleEl.innerText || titleEl.textContent;
  }
  
  // GET URL AND TITLE FROM FIRST H3 LINK
  if (!post.title) {
    const allH3 = elem.querySelectorAll('h3');
    if (allH3.length > 0) {
      const h3 = allH3[0];
      const link = h3.querySelector('a');
      if (link) {
        post.title = link.innerText || link.textContent;
        post.url = link.href;
      }
    }
  }
  
  // GET URL FROM COMMENTS LINK
  if (!post.url) {
    const commentLinks = elem.querySelectorAll('a[href*="/comments/"]');
    if (commentLinks.length > 0) {
      post.url = commentLinks[0].href;
    }
  }
  
  // GET AUTHOR
  const authorLink = elem.querySelector('[data-testid="post_author_link"]');
  if (authorLink) {
    post.author = (authorLink.innerText || authorLink.textContent).trim();
  } else {
    const allLinks = elem.querySelectorAll('a');
    for (let link of allLinks) {
      if (link.href && link.href.includes('/user/')) {
        post.author = (link.innerText || link.textContent).trim();
        break;
      }
    }
  }
  
  // GET SUBREDDIT
  const subLink = elem.querySelector('[data-testid="subreddit_link"]');
  if (subLink) {
    post.subreddit = (subLink.innerText || subLink.textContent).trim().replace(/^r\//, '');
  } else {
    post.subreddit = getSubreddit();
  }
  
  // GET UPVOTES
  const votes = elem.querySelectorAll('[aria-label*="upvote"], [aria-label*="point"]');
  if (votes.length > 0) {
    const label = votes[0].getAttribute('aria-label') || '';
    post.upvotes = parseNum(label);
  }
  
  // GET COMMENTS
  const comments = elem.querySelectorAll('[aria-label*="comment"]');
  if (comments.length > 0) {
    const label = comments[0].getAttribute('aria-label') || '';
    post.comments = parseNum(label);
  }
  
  return post;
}

function parseNum(str) {
  if (!str) return 0;
  const match = String(str).match(/(\d+\.?\d*)\s*([KMB])?/);
  if (!match) return 0;
  let n = parseFloat(match[1]);
  if (match[2] === 'K') n *= 1000;
  else if (match[2] === 'M') n *= 1000000;
  else if (match[2] === 'B') n *= 1000000000;
  return Math.round(n);
}

function getSubreddit() {
  const m = window.location.href.match(/\/r\/([a-z0-9_]+)/i);
  return m ? m[1] : 'unknown';
}


// Utility: wait for N milliseconds
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Scroll the page to load more posts. Repeats until no new posts appear
 * or until maxScrolls is reached.
 * @param {number} maxScrolls
 * @param {number} delay - ms between scrolls
 */
async function handleScroll(maxScrolls = 10, delay = 1200) {
  let lastCount = 0;
  let sameCountRuns = 0;

  for (let i = 0; i < maxScrolls; i++) {
    // get current posts count using same strategy as scrapeAllPosts
    let postElements = document.querySelectorAll('[data-testid="post-container"]');
    if (!postElements || postElements.length === 0) {
      postElements = document.querySelectorAll('article');
    }
    if (!postElements || postElements.length === 0) {
      postElements = document.querySelectorAll('div[role="presentation"]');
    }
    if (!postElements || postElements.length === 0) {
      postElements = document.querySelectorAll('div[class*="Post"], div[class*="post"]');
    }

    const currentCount = postElements.length || 0;
    // If no change for 2 iterations, consider loaded
    if (currentCount === lastCount) {
      sameCountRuns += 1;
    } else {
      sameCountRuns = 0;
    }

    if (sameCountRuns >= 2) {
      return { message: 'No more posts loading', postsLoaded: currentCount };
    }

    lastCount = currentCount;

    // Scroll down
    window.scrollBy({ top: window.innerHeight, left: 0, behavior: 'smooth' });
    await sleep(delay);
  }

  // final count after scrolling
  let finalPosts = document.querySelectorAll('[data-testid="post-container"]');
  if (!finalPosts || finalPosts.length === 0) finalPosts = document.querySelectorAll('article');
  const finalCount = finalPosts.length || 0;
  return { message: 'Max scrolls reached', postsLoaded: finalCount };
}

