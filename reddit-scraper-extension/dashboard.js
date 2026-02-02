/**
 * Dashboard Script
 * Displays analytics and visualizations of scraped Reddit data
 */

let currentSession = null;
let chartInstances = {};

/**
 * Initialize dashboard on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Dashboard] Loading...');
    setupEventListeners();
    loadSessions();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    document.getElementById('backBtn').addEventListener('click', () => {
        window.close();
    });
    
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadSessions();
    });
    
    document.getElementById('sessionSelect').addEventListener('change', (e) => {
        loadSessionData(e.target.value);
    });
    
    document.getElementById('exportAllBtn').addEventListener('click', exportSessionData);
    
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterTable(e.target.value);
    });
    
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        sortTable(e.target.value);
    });
}

/**
 * Load all sessions from storage
 */
function loadSessions() {
    chrome.storage.local.get(['scrapedData'], (result) => {
        const sessions = result.scrapedData || [];
        const select = document.getElementById('sessionSelect');
        
        // Clear existing options
        select.innerHTML = '<option value="">Select a session...</option>';
        
        if (sessions.length === 0) {
            showEmptyState();
            return;
        }
        
        // Add session options
        sessions.forEach((session, index) => {
            const option = document.createElement('option');
            const date = new Date(session.timestamp);
            option.value = index;
            option.textContent = `Session ${index + 1} - ${date.toLocaleString()}`;
            select.appendChild(option);
        });
        
        // Load latest session
        select.value = sessions.length - 1;
        loadSessionData(sessions.length - 1);
    });
}

/**
 * Load and display session data
 */
function loadSessionData(index) {
    if (index === '') {
        showEmptyState();
        return;
    }
    
    chrome.storage.local.get(['scrapedData'], (result) => {
        const sessions = result.scrapedData || [];
        currentSession = sessions[index];
        
        if (!currentSession || !currentSession.data || !currentSession.data.posts) {
            showEmptyState();
            return;
        }
        
        const posts = currentSession.data.posts;
        
        console.log('[Dashboard] Loaded session with', posts.length, 'posts');
        
        // Update all UI elements
        updateSummary(posts);
        updateCharts(posts);
        populateTable(posts);
        updateUserStats(posts);
        updateMetadata();
        
        document.getElementById('emptyState').style.display = 'none';
    });
}

/**
 * Update summary cards
 */
function updateSummary(posts) {
    const totalPosts = posts.length;
    const totalUpvotes = posts.reduce((sum, p) => sum + p.upvotes, 0);
    const totalComments = posts.reduce((sum, p) => sum + p.comments, 0);
    const uniqueUsers = new Set(posts.map(p => p.author)).size;
    
    document.getElementById('summaryTotalPosts').textContent = totalPosts;
    document.getElementById('summaryUniqueUsers').textContent = uniqueUsers;
    document.getElementById('summaryTotalUpvotes').textContent = totalUpvotes.toLocaleString();
    document.getElementById('summaryTotalComments').textContent = totalComments.toLocaleString();
}

/**
 * Create and update all charts
 */
function updateCharts(posts) {
    createEngagementChart(posts);
    createTopPostsChart(posts);
    createCommentsChart(posts);
    createUsersChart(posts);
}

/**
 * Create engagement distribution chart
 */
function createEngagementChart(posts) {
    const ctx = document.getElementById('engagementChart').getContext('2d');
    
    // Destroy existing chart
    if (chartInstances.engagement) {
        chartInstances.engagement.destroy();
    }
    
    // Categorize posts by engagement level
    const low = posts.filter(p => p.upvotes < 100).length;
    const medium = posts.filter(p => p.upvotes >= 100 && p.upvotes < 500).length;
    const high = posts.filter(p => p.upvotes >= 500 && p.upvotes < 2000).length;
    const viral = posts.filter(p => p.upvotes >= 2000).length;
    
    chartInstances.engagement = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Low (< 100)', 'Medium (100-500)', 'High (500-2K)', 'Viral (2K+)'],
            datasets: [{
                data: [low, medium, high, viral],
                backgroundColor: ['#e9ecef', '#ffc107', '#17a2b8', '#ff4500'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 12 },
                        padding: 15
                    }
                }
            }
        }
    });
}

/**
 * Create top posts chart
 */
function createTopPostsChart(posts) {
    const ctx = document.getElementById('topPostsChart').getContext('2d');
    
    if (chartInstances.topPosts) {
        chartInstances.topPosts.destroy();
    }
    
    // Get top 5 posts by upvotes
    const topPosts = posts
        .sort((a, b) => b.upvotes - a.upvotes)
        .slice(0, 5);
    
    const labels = topPosts.map((p, i) => `#${i + 1}`);
    const data = topPosts.map(p => p.upvotes);
    
    chartInstances.topPosts = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Upvotes',
                data: data,
                backgroundColor: '#ff4500',
                borderColor: '#d63917',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { font: { size: 11 } }
                }
            }
        }
    });
}

/**
 * Create comments distribution chart
 */
function createCommentsChart(posts) {
    const ctx = document.getElementById('commentsChart').getContext('2d');
    
    if (chartInstances.comments) {
        chartInstances.comments.destroy();
    }
    
    // Categorize by comment count
    const noComments = posts.filter(p => p.comments === 0).length;
    const fewComments = posts.filter(p => p.comments > 0 && p.comments < 10).length;
    const moderateComments = posts.filter(p => p.comments >= 10 && p.comments < 50).length;
    const manyComments = posts.filter(p => p.comments >= 50).length;
    
    chartInstances.comments = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['No Comments', '1-9 Comments', '10-49 Comments', '50+ Comments'],
            datasets: [{
                label: 'Number of Posts',
                data: [noComments, fewComments, moderateComments, manyComments],
                backgroundColor: ['#e9ecef', '#17a2b8', '#0079d3', '#ff4500'],
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { font: { size: 11 } }
                }
            }
        }
    });
}

/**
 * Create top users chart
 */
function createUsersChart(posts) {
    const ctx = document.getElementById('usersChart').getContext('2d');
    
    if (chartInstances.users) {
        chartInstances.users.destroy();
    }
    
    // Count posts per user
    const userCounts = {};
    posts.forEach(post => {
        userCounts[post.author] = (userCounts[post.author] || 0) + 1;
    });
    
    // Get top 5 users
    const topUsers = Object.entries(userCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const labels = topUsers.map(([user]) => user);
    const data = topUsers.map(([_, count]) => count);
    
    chartInstances.users = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Posts',
                data: data,
                backgroundColor: '#0079d3',
                borderColor: '#0267b0',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { font: { size: 11 } }
                }
            }
        }
    });
}

/**
 * Populate posts table
 */
function populateTable(posts) {
    const tbody = document.getElementById('postsTableBody');
    tbody.innerHTML = '';
    
    posts.forEach((post, index) => {
        const row = document.createElement('tr');
        const timestamp = new Date(post.timestamp).toLocaleDateString();
        
        row.innerHTML = `
            <td class="index-col">${index + 1}</td>
            <td class="title-col">
                <a href="${post.postUrl}" target="_blank" title="${post.title}">
                    ${truncateText(post.title, 40)}
                </a>
            </td>
            <td class="author-col">${post.author}</td>
            <td class="upvotes-col">${post.upvotes.toLocaleString()}</td>
            <td class="comments-col">${post.comments.toLocaleString()}</td>
            <td class="timestamp-col">${timestamp}</td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * Filter table by search query
 */
function filterTable(query) {
    const rows = document.querySelectorAll('#postsTableBody tr');
    
    rows.forEach(row => {
        const title = row.querySelector('.title-col').textContent.toLowerCase();
        const author = row.querySelector('.author-col').textContent.toLowerCase();
        
        if (title.includes(query.toLowerCase()) || author.includes(query.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/**
 * Sort table by column
 */
function sortTable(sortBy) {
    if (!currentSession) return;
    
    const posts = currentSession.data.posts;
    
    switch (sortBy) {
        case 'upvotes':
            posts.sort((a, b) => b.upvotes - a.upvotes);
            break;
        case 'comments':
            posts.sort((a, b) => b.comments - a.comments);
            break;
        case 'date':
        default:
            posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    populateTable(posts);
}

/**
 * Update user statistics section
 */
function updateUserStats(posts) {
    const userStats = {};
    
    posts.forEach(post => {
        if (!userStats[post.author]) {
            userStats[post.author] = {
                author: post.author,
                posts: 0,
                totalUpvotes: 0,
                totalComments: 0,
                avgUpvotes: 0,
                avgComments: 0
            };
        }
        
        userStats[post.author].posts++;
        userStats[post.author].totalUpvotes += post.upvotes;
        userStats[post.author].totalComments += post.comments;
    });
    
    // Calculate averages
    Object.values(userStats).forEach(user => {
        user.avgUpvotes = Math.round(user.totalUpvotes / user.posts);
        user.avgComments = Math.round(user.totalComments / user.posts);
    });
    
    // Get top 10 users by posts
    const topUsers = Object.values(userStats)
        .sort((a, b) => b.posts - a.posts)
        .slice(0, 10);
    
    const grid = document.getElementById('usersGrid');
    grid.innerHTML = '';
    
    topUsers.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = `
            <div class="user-header">
                <div class="user-avatar">${user.author.charAt(0).toUpperCase()}</div>
                <div class="user-name">${user.author}</div>
            </div>
            <div class="user-stats">
                <div class="user-stat">
                    <span class="stat-label">Posts</span>
                    <span class="stat-value">${user.posts}</span>
                </div>
                <div class="user-stat">
                    <span class="stat-label">Avg Upvotes</span>
                    <span class="stat-value">${user.avgUpvotes}</span>
                </div>
                <div class="user-stat">
                    <span class="stat-label">Avg Comments</span>
                    <span class="stat-value">${user.avgComments}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

/**
 * Update metadata section
 */
function updateMetadata() {
    const data = currentSession.data;
    
    document.getElementById('metaScrapeTime').textContent = 
        new Date(currentSession.timestamp).toLocaleString();
    document.getElementById('metaPageUrl').textContent = 
        data.pageUrl || '-';
    document.getElementById('metaSubreddit').textContent = 
        data.subreddit || '-';
    document.getElementById('metaDataPoints').textContent = 
        data.posts.length || '0';
}

/**
 * Export session data
 */
function exportSessionData() {
    if (!currentSession) {
        alert('No session selected');
        return;
    }
    
    const posts = currentSession.data.posts;
    
    // JSON export
    const jsonData = JSON.stringify(posts, null, 2);
    downloadFile('reddit-analytics.json', jsonData, 'application/json');
    
    // CSV export
    const csvData = convertToCSV(posts);
    downloadFile('reddit-analytics.csv', csvData, 'text/csv');
}

/**
 * Convert posts to CSV
 */
function convertToCSV(posts) {
    const headers = ['ID', 'Title', 'Author', 'Subreddit', 'Upvotes', 'Comments', 'URL', 'Timestamp'];
    
    const rows = posts.map(post => [
        post.id,
        `"${post.title.replace(/"/g, '""')}"`,
        post.author,
        post.subreddit,
        post.upvotes,
        post.comments,
        post.postUrl,
        post.timestamp
    ]);
    
    return [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
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
 * Show empty state
 */
function showEmptyState() {
    document.getElementById('emptyState').style.display = 'block';
    document.querySelectorAll('.summary-cards, .charts-section, .posts-section, .users-section').forEach(el => {
        el.style.opacity = '0.5';
        el.style.pointerEvents = 'none';
    });
}

/**
 * Truncate text
 */
function truncateText(text, length) {
    return text.length > length ? text.substring(0, length) + '...' : text;
}

console.log('[Dashboard] Script loaded');
