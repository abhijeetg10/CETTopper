// --- 1. GLOBAL STATE ---
// Removed hardcoded leaderboardData

// --- 2. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadExamCountdown();
    loadDashboardData();
    setupUI();
});

function setupUI() {
    // Sidebar Toggle
    const toggleBtn = document.getElementById('toggle-sidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-open');
        });
    }

    // Initialize Default View
    showSection(window.location.hash.substring(1) || 'home');

    // Search Enter Key
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }
}

// Helper: Setup Navigation (if needed for non-inline)
function setupNavigation() {
    // Currently handled via inline onclick in HTML
}

async function loadExamCountdown() {
    try {
        const res = await fetch('/api/settings/exam-date');
        const data = await res.json();
        const el = document.getElementById('examCountdown');
        const targetEl = document.getElementById('examDateTarget');

        if (!data.examDate) {
            el.innerText = "Date TBD";
            if (targetEl) targetEl.innerText = "Target: Top 100";
            return;
        }

        const examDate = new Date(data.examDate);
        const today = new Date();
        const diffTime = examDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            el.innerText = `${diffDays} Days Left`;
        } else if (diffDays === 0) {
            el.innerText = "Exam is Today!";
        } else {
            el.innerText = "Exam Completed";
        }
    } catch (err) {
        console.error("Failed to load exam date", err);
    }
}

async function loadDashboardData() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        // Update sidebar profile name
        const sidebarName = document.querySelector('.user-mini-profile div[style*="font-weight: 600"]');
        if (sidebarName) sidebarName.innerText = user.name;

        // Update sidebar avatar
        const sidebarAvatar = document.querySelector('.user-avatar');
        if (sidebarAvatar) sidebarAvatar.innerText = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    fetchTests();
    fetchLeaderboard('school'); // Default
    fetchAnalytics();
}

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!user || !token) {
        window.location.href = 'login.html';
        return;
    }

    // Logout Logic if not already added
    const logoutBtn = document.getElementById('logoutBtn'); // In Profile page
    // For Dashboard header, we might need a logout button if not present
    // The existing HTML has a dashboard header without logout, but sidebar has profile.
    // Profile page has logout. 
    // Let's ensure if there is a logout button in the DOM, it works.
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    }
}

// Helper for Auth Fetch
async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
        console.warn("Session expired or unauthorized. Redirecting to login.");
        // Optional: Alert user instead of silent redirect if debugging
        // alert("Session expired. Please login again.");
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        throw new Error("Session expired");
    }
    return response;
}

// --- 3. DATA FETCHING ---
let allTests = []; // Store fetched tests globally

async function fetchTests() {
    try {
        const response = await authFetch('/api/tests');
        allTests = await response.json(); // Store in global variable

        if (allTests.length > 0) {
            renderTestGrid('full-length-grid', allTests.filter(t => t.category === 'Full Length'));
            // Could also render other categories here if needed
        } else {
            document.getElementById('full-length-grid').innerHTML = '<p style="padding:20px;">No tests available. Please seed the database.</p>';
        }
    } catch (err) {
        console.error("Error fetching tests:", err);
        // Only show error if not redirected
        if (localStorage.getItem('token')) {
            document.getElementById('full-length-grid').innerHTML = '<p style="color:red; padding:20px;">Failed to load tests.</p>';
        }
    }
}

function performSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!query) return;

    const results = allTests.filter(test =>
        test.title.toLowerCase().includes(query) ||
        (test.subject && test.subject.toLowerCase().includes(query)) ||
        (test.category && test.category.toLowerCase().includes(query))
    );

    showSection('search-results');

    if (results.length > 0) {
        renderTestGrid('search-results-grid', results);
    } else {
        document.getElementById('search-results-grid').innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #64748b;">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No tests found for "${query}"</p>
            </div>
        `;
    }
}

// Global variable to store fetching leaderboard data
let currentLeaderboardData = { school: [], global: [] };

async function fetchLeaderboard(type = 'school') {
    try {
        const response = await authFetch('/api/leaderboard');
        const data = await response.json();
        currentLeaderboardData = data;

        // Render
        renderLeaderboardUI(type);
    } catch (err) {
        console.error("Leaderboard error:", err);
    }
}

async function fetchAnalytics() {
    try {
        const response = await authFetch('/api/user/analytics');
        const data = await response.json();
        renderAnalyticsUI(data);
    } catch (err) {
        console.error("Analytics error:", err);
    }
}

// --- 4. RENDERING FUNCTIONS ---
function renderTestGrid(elementId, data) {
    const grid = document.getElementById(elementId);
    if (!grid) return;

    grid.innerHTML = data.map(test => `
        <div class="test-item">
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom: 12px;">
                <span class="badge" style="background: #e0e7ff; color: #4338ca;">${test.category}</span>
                <span style="font-size:0.8rem; font-weight:600; color:#64748b;">${test.totalMarks} Marks</span>
            </div>
            
            <h3 style="font-size: 1.1rem; margin-bottom: 8px; font-weight: 600;">${test.title}</h3>
            
            <div style="display: flex; gap: 15px; font-size: 0.85rem; color: #94a3b8; margin-bottom: 20px;">
                <span><i class="far fa-clock"></i> ${test.durationMovies || 180} mins</span>
                <span style="display:none;"><i class="far fa-question-circle"></i> Questions</span>
            </div>

            <button class="start-btn-sm" onclick="startTest('${test._id}')">
                Start Test <i class="fas fa-arrow-right" style="margin-left: 5px;"></i>
            </button>
        </div>
    `).join('');
}

function startTest(testId) {
    window.location.href = `test-interface.html?id=${testId}`;
}

// --- 4. NAVIGATION LOGIC ---
function showSection(sectionId) {
    if (!sectionId) sectionId = 'home';

    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');

    const targetId = sectionId === 'home' ? 'home-view' : `${sectionId}-view`;
    const targetEl = document.getElementById(targetId);
    if (targetEl) targetEl.style.display = 'block';

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(sectionId)) {
            item.classList.add('active');
        }
    });

    updateHeader(sectionId);

    if (sectionId === 'analytics') {
        fetchAnalytics(); // Fetch real data
    } else if (sectionId === 'leaderboard') {
        fetchLeaderboard(); // Refresh
    }

    history.pushState(null, null, `#${sectionId}`);
}

function updateHeader(sectionId) {
    const titleEl = document.querySelector('#header-text h1');
    const subEl = document.querySelector('#header-text p');
    const backBtn = document.getElementById('back-btn');

    if (sectionId === 'home') {
        titleEl.innerText = "Dashboard";
        subEl.innerText = "Welcome back, future topper!";
        backBtn.style.display = 'none';
    } else {
        backBtn.style.display = 'flex';
        const titles = {
            'analytics': ['Analytics', 'Track your performance growth'],
            'leaderboard': ['Leaderboard', 'See where you stand'],
            'full-length': ['Full Length Mocks', 'Simulate the real exam'],
            'unit-tests': ['Unit Tests', 'Chapter-wise practice'],
            'subjects': ['Subjects', 'Focus on specific topics'],
            'chapter-tests': ['Chapter Tests', 'Deep dive into concepts']
        };
        if (titles[sectionId]) {
            titleEl.innerText = titles[sectionId][0];
            subEl.innerText = titles[sectionId][1];
        }
    }
}

function showSubjectTests(subject) {
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    document.getElementById('chapter-tests-view').style.display = 'block';
    document.getElementById('subject-title').innerText = `${subject} Chapter Tests`;

    const backBtn = document.getElementById('back-btn');
    backBtn.style.display = 'flex';
    backBtn.onclick = () => {
        showSection('subjects');
        backBtn.onclick = () => showSection('home');
    };

    const grid = document.getElementById('chapter-tests-grid');

    // Filter tests by Subject and Category 'Chapter'
    const chapterTests = allTests.filter(t =>
        t.category === 'Chapter' &&
        t.subject === subject
    );

    if (chapterTests.length > 0) {
        grid.innerHTML = chapterTests.map(test => `
        <div class="test-item">
            <span class="badge" style="background:#dcfce7; color:#166534; width:fit-content;">${test.subject}</span>
            <h3 style="margin: 10px 0; font-size: 1.1rem; font-weight: 600;">${test.title}</h3>
             <div style="display: flex; gap: 15px; font-size: 0.85rem; color: #94a3b8; margin-bottom: 20px;">
                <span><i class="far fa-clock"></i> ${test.durationMovies || 30} mins</span>
                <span><i class="far fa-question-circle"></i> ${test.totalMarks} Marks</span>
            </div>
            <button class="start-btn-sm" onclick="startTest('${test._id}')">Start Test</button>
        </div>
        `).join('');
    } else {
        grid.innerHTML = '<p style="padding:20px; color:#64748b;">No tests available for this subject yet.</p>';
    }
}

// --- 5. ANALYTICS ---
let scoreChartInstance = null;
let subjectChartInstance = null;

function renderAnalyticsUI(data, detailedData) {
    const scoreCtx = document.getElementById('scoreChart').getContext('2d');
    const subjectCtx = document.getElementById('subjectChart').getContext('2d');

    if (scoreChartInstance) scoreChartInstance.destroy();
    if (subjectChartInstance) subjectChartInstance.destroy();

    // 1. Line Chart: Score History
    const labels = data.map(d => d.testTitle.substring(0, 15) + '...');
    const scores = data.map(d => d.score);

    scoreChartInstance = new Chart(scoreCtx, {
        type: 'line',
        data: {
            labels: labels.length ? labels : ['No Data'],
            datasets: [{
                label: 'Score',
                data: scores.length ? scores : [0],
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });

    // 2. Bar Chart: Subject Accuracy (Detailed)
    // If detailedData is available, use it. Otherwise fall back to aggregation from local data.
    let subjects = [];
    let accuracies = [];

    if (detailedData && detailedData.length > 0) {
        subjects = detailedData.map(d => d.subject);
        accuracies = detailedData.map(d => d.accuracy);

        // Render Weak Areas List if element exists
        // (We might need to create this element in index.html dynamically if not present, or alert the user)
        // For now, let's just log it or append it if we can find a container.
    } else {
        // Fallback
        const subjectMap = {};
        data.forEach(d => {
            if (!subjectMap[d.subject]) subjectMap[d.subject] = [];
            subjectMap[d.subject].push(d.accuracy);
        });
        subjects = Object.keys(subjectMap);
        accuracies = subjects.map(s => {
            const arr = subjectMap[s];
            return arr.reduce((a, b) => a + b, 0) / arr.length;
        });
    }

    subjectChartInstance = new Chart(subjectCtx, {
        type: 'bar', // Changed from doughnut to bar for better comparison
        data: {
            labels: subjects.length ? subjects : ['No Data'],
            datasets: [{
                label: 'Avg Accuracy (%)',
                data: accuracies.length ? accuracies : [0],
                backgroundColor: ['#3b82f6', '#f97316', '#ef4444', '#10b981'],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: 100 }
            }
        }
    });
}

// --- 6. LEADERBOARD ---
function switchLeaderboard(type) {
    fetchLeaderboard(type);

    // Update Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'transparent';
        btn.style.color = '#64748b';
        btn.style.boxShadow = 'none';
    });
    if (event) {
        event.target.classList.add('active');
        event.target.style.background = 'white';
        event.target.style.color = '#4f46e5';
        event.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
    }
}

function renderLeaderboardUI(type) {
    const data = currentLeaderboardData[type] || [];
    const podiumEl = document.getElementById('podium-display');
    const listEl = document.getElementById('leaderboard-body');

    // Podium
    if (data.length >= 3) {
        // Podium Order: 2, 1, 3 (Indices: 1, 0, 2)
        const podiumOrder = [data[1], data[0], data[2]];
        const places = [2, 1, 3];

        podiumEl.innerHTML = podiumOrder.map((student, i) => `
            <div style="text-align: center; display: flex; flex-direction: column; align-items: center; width: 100px;">
                <div style="width: 50px; height: 50px; background: ${places[i] === 1 ? '#eab308' : '#cbd5e1'}; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 10px;"></div>
                <div style="width: 100%; height: ${places[i] === 1 ? '100px' : (places[i] === 2 ? '70px' : '50px')}; background: ${places[i] === 1 ? 'linear-gradient(to top, #ca8a04, #fbbf24)' : (places[i] === 2 ? '#94a3b8' : '#f97316')}; border-radius: 10px 10px 0 0; display: flex; align-items: flex-end; justify-content: center; color: white; font-weight: 700; padding-bottom: 5px;">
                    ${places[i]}
                </div>
                <p style="font-size: 0.8rem; margin-top:5px; font-weight:600;">${student.name.split(' ')[0]}</p>
                <p style="font-size: 0.7rem; color:#64748b;">${student.score}</p>
            </div>
        `).join('');
    } else {
        podiumEl.innerHTML = '<p style="text-align:center; width:100%; color:#64748b;">Not enough data for podium</p>';
    }

    // List
    listEl.innerHTML = data.map(student => {
        const isUser = false; // We could match ID if available in student obj
        return `
        <tr style="${isUser ? 'background: #eff6ff;' : ''} border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 15px;">
                <div style="width: 30px; height: 30px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #64748b;">${student.rank}</div>
            </td>
            <td style="padding: 15px;">
                <div style="font-weight: 600; color: #1e293b;">${student.name}</div>
            </td>
            <td style="padding: 15px; color: #64748b;">${student.accuracy}</td>
            <td style="padding: 15px; text-align: right; font-weight: 700; color: #4f46e5;">${student.score}</td>
        </tr>
        `;
    }).join('');
}

// Init leaderboard on load logic handled by showSection('leaderboard') or default load
// We can manually trigger it for the default 'School' view if needed when switching to leaderboard