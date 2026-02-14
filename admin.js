// admin.js

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadDashboardStats();
    setupNavigation();
});

// --- Auth & Init ---

async function checkAdminAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        alert("Access Denied. Admins only.");
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('adminName').innerText = user.name;
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class
            navItems.forEach(n => n.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Add active class
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Load data if needed
            if (targetId === 'dashboard') loadDashboardStats();
            if (targetId === 'manage-tests') fetchTestsList();
            if (targetId === 'view-students') fetchStudents();
            if (targetId === 'view-results') fetchResults();
        });
    });
}
// ... (keep existing stats logic or update later)

async function fetchStudents() {
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await res.json();

        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${u.name} <span class="badge ${u.subscriptionStatus === 'premium' ? 'badge-green' : 'badge-blue'}">${u.subscriptionStatus}</span></td>
                <td>${u.email}</td>
                <td>${new Date(u.createdAt).toLocaleDateString()}</td>
                <td>${u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</td>
            </tr>
        `).join('');
    } catch (err) { tbody.innerHTML = `<tr><td colspan="4">Error: ${err.message}</td></tr>`; }
}

async function fetchResults() {
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/admin/results', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const results = await res.json();

        tbody.innerHTML = results.map(r => `
            <tr>
                <td>${r.testTitle}</td>
                <td>${r.studentName}</td>
                <td>${r.score} / ${r.totalMarks} (${Math.round(r.accuracy)}%)</td>
                <td>${new Date(r.date).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (err) { tbody.innerHTML = `<tr><td colspan="4">Error: ${err.message}</td></tr>`; }
}

// --- Dashboard Stats ---

async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch parallel
        const [testsRes, usersRes, resultsRes] = await Promise.all([
            fetch('http://localhost:3000/api/tests', { headers }),
            fetch('http://localhost:3000/api/admin/users', { headers }),
            fetch('http://localhost:3000/api/admin/results', { headers })
        ]);

        const tests = await testsRes.json();
        const users = await usersRes.json();
        const results = await resultsRes.json();

        // Animate/Update Numbers
        animateValue("stat-students", 0, users.length || 0, 1000);
        animateValue("stat-tests", 0, tests.length || 0, 1000);
        animateValue("stat-attempts", 0, results.length || 0, 1000);

        // Load Exam Date
        const dateRes = await fetch('http://localhost:3000/api/settings/exam-date');
        const dateData = await dateRes.json();
        if (dateData.examDate) {
            document.getElementById('examDateInput').value = dateData.examDate.split('T')[0];
        }

    } catch (err) {
        console.error("Failed to load stats:", err);
        // ... err handling
    }
}

async function saveExamDate() {
    const date = document.getElementById('examDateInput').value;
    const msg = document.getElementById('examDateMsg');
    if (!date) return alert("Please select a date first.");

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/admin/settings/exam-date', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ date })
        });

        if (res.ok) {
            msg.innerText = "Date updated successfully!";
            setTimeout(() => msg.innerText = "", 3000);
        } else {
            throw new Error("Failed to update");
        }
    } catch (err) {
        alert(err.message);
    }
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end;
        }
    };
    window.requestAnimationFrame(step);
}

// --- Create Test Logic ---

let questionCount = 0;

function addQuestionField() {
    questionCount++;
    const container = document.getElementById('questions-container');
    const html = `
    <div class="question-box" id="q-${questionCount}">
        <button type="button" class="delete-btn" onclick="this.parentElement.remove()" title="Remove Question">
            <i class="fas fa-times"></i>
        </button>
        <div class="form-group">
            <label>Question ${questionCount}</label>
            <textarea class="q-text" rows="2" placeholder="Enter question text here..." required></textarea>
        </div>
        <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom:1rem;">
            <input type="text" class="opt-1" placeholder="Option A" required>
            <input type="text" class="opt-2" placeholder="Option B" required>
            <input type="text" class="opt-3" placeholder="Option C" required>
            <input type="text" class="opt-4" placeholder="Option D" required>
        </div>
        <div class="form-group" style="width: 50%;">
            <label>Correct Answer</label>
            <select class="correct-opt" required>
                <option value="1">Option A</option>
                <option value="2">Option B</option>
                <option value="3">Option C</option>
                <option value="4">Option D</option>
            </select>
        </div>
    </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

document.getElementById('createTestForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
    btn.disabled = true;

    try {
        const testData = {
            title: document.getElementById('testTitle').value,
            category: document.getElementById('testCategory').value,
            subject: document.getElementById('testSubject').value,
            totalMarks: document.getElementById('totalMarks').value,
            duration: document.getElementById('duration').value,
            questions: []
        };

        const questionBoxes = document.querySelectorAll('.question-box');
        if (questionBoxes.length === 0) throw new Error("Add at least one question.");

        questionBoxes.forEach(box => {
            const qText = box.querySelector('.q-text').value;
            const options = [
                box.querySelector('.opt-1').value,
                box.querySelector('.opt-2').value,
                box.querySelector('.opt-3').value,
                box.querySelector('.opt-4').value
            ];
            const correctVal = box.querySelector('.correct-opt').value;

            testData.questions.push({
                text: qText,
                options: options,
                correctIndex: parseInt(correctVal) - 1,
                marks: 2 // Default
            });
        });

        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/tests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testData)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to create test');
        }

        alert("Test Created Successfully!");
        e.target.reset();
        document.getElementById('questions-container').innerHTML = '';
        questionCount = 0;

        // Switch to manage tab
        document.querySelector('[data-target="manage-tests"]').click();

    } catch (err) {
        alert(err.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// --- Manage Tests Logic ---

async function fetchTestsList() {
    const tbody = document.getElementById('testsTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/tests', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tests = await response.json();

        tbody.innerHTML = '';
        if (tests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No tests found. Create one!</td></tr>';
            return;
        }

        tests.forEach((test, index) => {
            const row = `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div style="font-weight:600;">${test.title}</div>
                    <div style="font-size:0.85rem; color:#64748b;">${test.subject || 'General'}</div>
                </td>
                <td><span class="badge badge-blue">${test.category}</span></td>
                <td>${test.totalMarks} Marks / ${test.durationMovies} Mins</td>
                <td>
                    <button class="btn btn-danger" style="padding:6px 12px; font-size:0.85rem;" onclick="deleteTest('${test._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Error: ${err.message}</td></tr>`;
    }
}

async function deleteTest(testId) {
    if (!confirm("Are you sure you want to delete this test? This cannot be undone.")) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/tests/${testId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to delete test");

        // Refresh list
        fetchTestsList();

    } catch (err) {
        alert(err.message);
    }
}
