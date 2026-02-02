"""
Reddit Web Scraping Techniques Comparison
Demonstrates different methods to extract data from Reddit with ethical considerations
"""

import requests
import json
from typing import List, Dict
import time

# ============================================================================
# METHOD 1: Using Reddit's Official API (PRAW) - RECOMMENDED
# ============================================================================

def method_1_official_api():
    """
    Most ethical and reliable method using PRAW (Python Reddit API Wrapper)
    
    Advantages:
    - Official, legal, and approved method
    - Respects Reddit's terms of service
    - No rate limiting issues
    - Access to authenticated endpoints
    
    Challenges:
    - Requires API credentials (free registration)
    - Requires PRAW installation: pip install praw
    - Rate limiting (60 requests/minute for unauthenticated)
    
    Setup:
    1. Go to https://www.reddit.com/prefs/apps
    2. Create a script application
    3. Get: client_id, client_secret, user_agent
    """
    try:
        import praw
        
        # Initialize Reddit connection
        reddit = praw.Reddit(
            client_id='YOUR_CLIENT_ID',
            client_secret='YOUR_CLIENT_SECRET',
            user_agent='YOUR_USER_AGENT'
        )
        
        # Example: Fetch top posts from a subreddit
        subreddit = reddit.subreddit('python')
        posts_data = []
        
        for post in subreddit.top(time_filter='week', limit=10):
            post_info = {
                'title': post.title,
                'author': str(post.author),
                'score': post.score,
                'comments': post.num_comments,
                'url': post.url,
                'created_utc': post.created_utc
            }
            posts_data.append(post_info)
            print(f"✓ Fetched: {post.title[:50]}...")
        
        return posts_data
        
    except ImportError:
        print("⚠ PRAW not installed. Install with: pip install praw")
        return None


# ============================================================================
# METHOD 2: Using Requests + BeautifulSoup (Web Scraping)
# ============================================================================

def method_2_requests_beautifulsoup():
    """
    Manual web scraping using Requests and BeautifulSoup
    
    Advantages:
    - No authentication needed
    - Works without API
    - Flexible HTML parsing
    
    Challenges:
    - May violate Reddit's ToS (robots.txt restrictions)
    - HTML structure changes break the code
    - Risk of IP blocking
    - No rate limiting protection
    
    Legal/Ethical Considerations:
    - Reddit explicitly discourages this in their ToS
    - Check robots.txt: reddit.com/robots.txt
    - Use responsibly with delays between requests
    """
    try:
        from bs4 import BeautifulSoup
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        url = 'https://www.reddit.com/r/python/top/?t=week'
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            print(f"✗ Failed to fetch. Status: {response.status_code}")
            return None
        
        soup = BeautifulSoup(response.content, 'html.parser')
        posts_data = []
        
        # Note: Reddit's HTML structure is complex and changes frequently
        # This is a simplified example
        post_links = soup.find_all('a', {'data-testid': 'internal-umaami-link'})
        
        for link in post_links[:10]:
            try:
                post_info = {
                    'title': link.get_text(),
                    'url': link.get('href')
                }
                posts_data.append(post_info)
                print(f"✓ Scraped: {post_info['title'][:50]}...")
            except Exception as e:
                print(f"✗ Error parsing post: {e}")
        
        return posts_data
        
    except ImportError:
        print("⚠ BeautifulSoup not installed. Install with: pip install beautifulsoup4")
        return None


# ============================================================================
# METHOD 3: Using Pushshift API (Historical Data)
# ============================================================================

def method_3_pushshift_api():
    """
    Access historical Reddit data via Pushshift API
    
    Advantages:
    - Access to historical data
    - No authentication needed
    - Good for research
    
    Challenges:
    - Pushshift is no longer officially supported
    - May have limited availability
    - Still requires ethical usage
    
    Note: Pushshift is being deprecated. Use official API for production.
    """
    try:
        # Pushshift API endpoint
        url = 'https://api.pushshift.io/reddit/search/submission/'
        
        params = {
            'subreddit': 'python',
            'sort': 'score',
            'sort_type': 'desc',
            'size': 10
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            posts_data = []
            
            for post in data.get('data', []):
                post_info = {
                    'title': post.get('title'),
                    'score': post.get('score'),
                    'author': post.get('author'),
                    'created_utc': post.get('created_utc')
                }
                posts_data.append(post_info)
                print(f"✓ Fetched: {post_info['title'][:50]}...")
            
            return posts_data
        else:
            print(f"✗ API Error: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"✗ Error: {e}")
        return None


# ============================================================================
# METHOD 4: Using JSON Endpoint (Limited Data)
# ============================================================================

def method_4_json_endpoint():
    """
    Fetch data from Reddit's JSON endpoint
    
    Advantages:
    - Simple, no external libraries needed
    - Officially available endpoint
    - Respects Reddit's ToS better than HTML scraping
    
    Challenges:
    - Limited to recent posts
    - Limited to available fields
    - Still subject to rate limiting
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
        
        # Reddit provides JSON for any URL ending with .json
        url = 'https://www.reddit.com/r/python/top/.json?t=week&limit=10'
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            posts_data = []
            
            for post in data.get('data', {}).get('children', []):
                post_data = post.get('data', {})
                post_info = {
                    'title': post_data.get('title'),
                    'score': post_data.get('score'),
                    'author': post_data.get('author'),
                    'num_comments': post_data.get('num_comments'),
                    'url': post_data.get('url'),
                    'created_utc': post_data.get('created_utc')
                }
                posts_data.append(post_info)
                print(f"✓ Fetched: {post_info['title'][:50]}...")
            
            return posts_data
        else:
            print(f"✗ Error: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"✗ Error: {e}")
        return None


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def save_to_json(data: List[Dict], filename: str = 'reddit_posts.json'):
    """Save scraped data to JSON file"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✓ Data saved to {filename}")
        return True
    except Exception as e:
        print(f"✗ Error saving file: {e}")
        return False


def display_results(data: List[Dict], method_name: str):
    """Display scraping results in a formatted way"""
    if not data:
        print(f"\n⚠ No data from {method_name}\n")
        return
    
    print(f"\n{'='*70}")
    print(f"{method_name}")
    print(f"{'='*70}")
    print(f"Total posts fetched: {len(data)}\n")
    
    for i, post in enumerate(data, 1):
        print(f"{i}. {post.get('title', 'N/A')[:60]}...")
        if 'score' in post:
            print(f"   Score: {post['score']}")
        if 'author' in post:
            print(f"   Author: {post['author']}")
        print()


# ============================================================================
# ETHICAL GUIDELINES
# ============================================================================

ETHICAL_GUIDELINES = """
ETHICAL AND LEGAL CONSIDERATIONS FOR REDDIT SCRAPING:

1. TERMS OF SERVICE:
   - Always review Reddit's ToS: https://www.reddit.com/help/useragreement/
   - Automated scraping may violate ToS
   
2. ROBOTS.TXT:
   - Respect Reddit's robots.txt file
   - URL: https://www.reddit.com/robots.txt
   - Check what's allowed/disallowed
   
3. RATE LIMITING:
   - Implement delays between requests (2+ seconds recommended)
   - Don't overload Reddit's servers
   - Use official API for bulk operations
   
4. DATA PRIVACY:
   - Don't scrape personal information
   - Be mindful of user privacy
   - Don't store sensitive data unnecessarily
   
5. ATTRIBUTION:
   - Give credit to original posters
   - Include source information
   - Be transparent about data usage
   
6. RECOMMENDED APPROACH:
   - Use official PRAW API (Method 1) - BEST PRACTICE
   - Use JSON endpoint (Method 4) - ACCEPTABLE
   - Avoid HTML scraping (Method 2) - NOT RECOMMENDED
   - Check Pushshift status before using (Method 3)
   
7. USE CASES:
   - ✓ Research and analysis
   - ✓ Academic projects
   - ✓ Personal projects with proper delays
   - ✗ Commercial use without permission
   - ✗ Creating competing services
   - ✗ Aggressive scraping
"""


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Run comparison of different scraping methods"""
    
    print(ETHICAL_GUIDELINES)
    print("\n" + "="*70)
    print("TESTING DIFFERENT SCRAPING METHODS")
    print("="*70 + "\n")
    
    # Method 1: Official API (requires setup)
    print("1. Testing Official PRAW API...")
    print("   ⓘ Requires API credentials. Skipping unless configured.\n")
    
    # Method 4: JSON Endpoint (most reliable, legal)
    print("2. Testing JSON Endpoint (Recommended)...\n")
    data_json = method_4_json_endpoint()
    if data_json:
        display_results(data_json, "JSON ENDPOINT METHOD")
        save_to_json(data_json)
    
    # Method 3: Pushshift API (for historical data)
    print("\n3. Testing Pushshift API (Historical Data)...\n")
    data_pushshift = method_3_pushshift_api()
    if data_pushshift:
        display_results(data_pushshift, "PUSHSHIFT API METHOD")
    
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    print("""
Best Practices:
1. Use official PRAW API for production applications
2. Always implement rate limiting and delays
3. Respect robots.txt and ToS
4. Consider the ethical implications
5. Cache results when possible to reduce requests
6. Document your data sources
    """)


if __name__ == "__main__":
    main()
