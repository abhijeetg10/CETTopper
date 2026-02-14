// Mock Question Data
// Removed static questions array

// State
let questions = []; // Loaded from API
let currentQuestionIndex = 0;
let userAnswers = {}; // { questionIndex: optionIndex }
// Proctoring State
let violationCount = 0;
const MAX_VIOLATIONS = 3;
let isTestActive = false;

// DOM Elements
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const qNumDisplay = document.getElementById('current-q-num');
const paletteContainer = document.getElementById('question-palette');
const timerDisplay = document.getElementById('timer');

// Init
document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!user || !token) {
        alert("Please login to take tests.");
        window.location.href = 'login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('id');

    if (!testId) {
        alert("No test ID provided. Redirecting to dashboard.");
        window.location.href = 'index.html';
        return;
    }

    await loadTestFromApi(testId, token);

    initPalette();
    loadQuestion(0);
    // Timer starts when user clicks "Enter Full Screen"
});

async function loadTestFromApi(testId, token) {
    try {
        const response = await fetch(`http://localhost:3000/api/tests/${testId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
            alert("Session expired. Please login again.");
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) throw new Error("Test not found");

        const testData = await response.json();
        questions = testData.questions;

        // Update Header Info
        document.querySelector('.test-header div:nth-child(2)').innerText = testData.title;

        // Set Timer based on duration if available, else default (mocked here)
        // timeLeft = (testData.durationMovies || 180) * 60; 

    } catch (err) {
        alert("Error loading test: " + err.message);
        window.location.href = 'index.html';
    }
}

// Timer Logic
let timeLeft = 180 * 60; // Default 3 hours
let timerInterval;

function startTimer() {
    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            submitTest();
            return;
        }
        timeLeft--;
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;
        timerDisplay.innerText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }, 1000);
}

function pad(n) { return n < 10 ? '0' + n : n; }

// Question Loading
function loadQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    currentQuestionIndex = index;

    // Update UI
    qNumDisplay.innerText = index + 1;
    const q = questions[index];
    questionText.innerText = q.text;

    // Render Options
    let optsHTML = '';
    const labels = ['A', 'B', 'C', 'D'];
    q.options.forEach((opt, i) => {
        const isSelected = userAnswers[index] === i ? 'selected' : '';
        optsHTML += `
        <div class="option-item ${isSelected}" onclick="selectOption(${i})">
            <div class="option-label">${labels[i]}</div>
            <div>${opt}</div>
        </div>
        `;
    });
    optionsContainer.innerHTML = optsHTML;

    // Update Palette Highlight
    updatePalette();
}

function selectOption(optionIndex) {
    userAnswers[currentQuestionIndex] = optionIndex;
    loadQuestion(currentQuestionIndex); // Re-render to show selection
    updatePalette();
}

function clearResponse() {
    delete userAnswers[currentQuestionIndex];
    loadQuestion(currentQuestionIndex);
    updatePalette();
}

function markForReview() {
    if (flaggedQuestions.has(currentQuestionIndex)) {
        flaggedQuestions.delete(currentQuestionIndex);
    } else {
        flaggedQuestions.add(currentQuestionIndex);
    }
    updatePalette();
}

// Global Set for flagged questions
const flaggedQuestions = new Set();

function changeQuestion(delta) {
    const newIndex = currentQuestionIndex + delta;
    if (newIndex >= 0 && newIndex < questions.length) {
        loadQuestion(newIndex);
    }
}

// Palette Logic
function initPalette() {
    let html = '';
    questions.forEach((_, i) => {
        html += `<div class="q-btn" id="p-btn-${i}" onclick="loadQuestion(${i})">${i + 1}</div>`;
    });
    paletteContainer.innerHTML = html;
}

function updatePalette() {
    questions.forEach((_, i) => {
        const btn = document.getElementById(`p-btn-${i}`);
        btn.className = 'q-btn'; // Reset

        // Priority Logic for Colors
        if (i === currentQuestionIndex) {
            btn.classList.add('current');
        }

        if (flaggedQuestions.has(i)) {
            btn.classList.add('review');
            if (userAnswers[i] !== undefined) {
                btn.style.border = "2px solid #f59e0b";
            }
        }
        else if (userAnswers[i] !== undefined) {
            btn.classList.add('answered');
        }
    });
}

// Submission
async function submitTest() {
    clearInterval(timerInterval);
    isTestActive = false; // Stop proctoring checks

    // Prepare Payload
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('id');

    const payload = {
        testId: testId,
        userAnswers: userAnswers,
        timeTaken: (180 * 60) - timeLeft, // Approx time taken
        violationCount: violationCount
    };

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (response.status === 401) {
            alert("Session expired. Please login again.");
            window.location.href = 'login.html';
            return;
        }

        const result = await response.json();

        // Show Result Overlay
        const overlay = document.getElementById('result-overlay');
        overlay.style.display = 'flex';

        // Update Score in Modal
        const scoreDisplay = overlay.querySelector('h1');
        scoreDisplay.innerHTML = `${result.score}<span style="font-size:1rem; color:#64748b;">/${result.totalMarks}</span>`;

        const textTarget = overlay.querySelector('p');
        textTarget.innerText = `You answered ${result.correctCount} out of ${result.totalQuestions} questions correctly.\nAccuracy: ${result.accuracy ? result.accuracy.toFixed(1) : 0}%`;

    } catch (err) {
        alert("Error submitting test: " + err.message);
    }
}

// --- PROCTORING LOGIC ---

function enterFullScreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().then(() => {
            // Once full screen is active, start the session
            startTestSession();
        }).catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        alert("Full screen API is not supported in this browser.");
        startTestSession(); // Fallback
    }
}

function startTestSession() {
    const overlay = document.getElementById('start-overlay');
    if (overlay) overlay.style.display = 'none';

    isTestActive = true;
    startTimer();

    // Listeners
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    // Anti-Cheating (Disable Right Click, Copy, Paste)
    document.addEventListener('contextmenu', event => event.preventDefault());
    document.addEventListener('copy', event => event.preventDefault());
    document.addEventListener('cut', event => event.preventDefault());
    document.addEventListener('paste', event => event.preventDefault());
}

function handleFullScreenChange() {
    if (!document.fullscreenElement && isTestActive) {
        issueWarning("You exited Full Screen mode.");
    }
}

function handleVisibilityChange() {
    if (document.hidden && isTestActive) {
        issueWarning("You switched tabs/minimized the window.");
    }
}

// Optional strict blur check
function handleWindowBlur() {
    // Some browsers treat clicking an alert as a blur, so be careful.
    // For this demo, we'll rely on visibilityChange mostly.
}

function issueWarning(reason) {
    if (!isTestActive) return;

    violationCount++;

    // Update Warning Overlay
    const warningEl = document.getElementById('warning-overlay');
    const countEl = document.getElementById('warning-count');

    if (warningEl && countEl) {
        countEl.innerText = violationCount;
        warningEl.querySelector('p').innerHTML = `${reason} <strong>${violationCount}</strong>/${MAX_VIOLATIONS} warnings used.`;

        warningEl.style.display = 'block';
        setTimeout(() => {
            warningEl.style.display = 'none';
        }, 3000);
    }

    // Check Limit
    if (violationCount > MAX_VIOLATIONS) {
        endTestDueToViolation();
    }
}

function endTestDueToViolation() {
    isTestActive = false;
    clearInterval(timerInterval);

    // Ensure full screen exit so overlay is visible if needed (though overlay is inside)
    if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => { });
    }

    const overlay = document.getElementById('result-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.innerHTML = `
            <div style="background:white; padding:2rem; border-radius:16px; width:450px; text-align:center; border: 2px solid #be123c;">
                <i class="fas fa-ban" style="font-size:4rem; color:#be123c; margin-bottom:1rem;"></i>
                <h2 style="color:#be123c; margin-bottom:10px;">Test Terminated</h2>
                <p style="color:#64748b; margin-bottom:2rem;">
                    You exceeded the maximum number of proctoring violations.<br>
                    (Tab switches or exiting full screen).
                </p>
                <button class="btn-primary" style="width:100%; justify-content:center; background:#be123c; border:none;" onclick="window.location.href='index.html'">Return to Dashboard</button>
            </div>
        `;
    }
}
