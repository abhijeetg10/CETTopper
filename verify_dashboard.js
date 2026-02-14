// verify_dashboard.js
// Native fetch is available in Node 18+

async function run() {
    const baseUrl = 'http://localhost:3000/api';
    const authUrl = 'http://localhost:3000/api/auth';

    console.log("--- 1. Register User ---");
    const email = `test${Date.now()}@example.com`;
    const password = "password123";

    let res = await fetch(`${authUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: "Dashboard Tester", email, password })
    });
    console.log("Register:", res.status);

    console.log("--- 2. Login User ---");
    res = await fetch(`${authUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const authData = await res.json();
    console.log("Login Success:", authData.success);
    const token = authData.token;

    if (!token) {
        console.error("No token received!");
        return;
    }

    console.log("--- 3. Fetch Tests (Protected) ---");
    res = await fetch(`${baseUrl}/tests`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const tests = await res.json();
    console.log("Tests found:", tests.length);
    let testId = tests.length > 0 ? tests[0]._id : null;

    if (testId) {
        console.log("--- 4. Submit Test (Generate Result) ---");
        const payload = {
            testId: testId,
            userAnswers: { "0": 0, "1": 1 }, // Dummy answers
            timeTaken: 120
        };
        res = await fetch(`${baseUrl}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        const scoreData = await res.json();
        console.log("Score:", scoreData.score);
    } else {
        console.log("Skipping submission (no tests)");
    }

    console.log("--- 5. Fetch Dashboard Data ---");
    // Leaderboard
    res = await fetch(`${baseUrl}/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const lb = await res.json();
    console.log("Leaderboard (School) Count:", lb.school.length);
    console.log("Leaderboard Top:", lb.school[0]);

    // Analytics
    res = await fetch(`${baseUrl}/user/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const analytics = await res.json();
    console.log("Analytics Records:", analytics.length);
    if (analytics.length > 0) {
        console.log("Latest Test:", analytics[analytics.length - 1].testTitle);
    }
}

run().catch(console.error);
