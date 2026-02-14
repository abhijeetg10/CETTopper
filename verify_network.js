const mongoose = require('mongoose');
const { User, Test, Result } = require('./models/Schema');
const dotenv = require('dotenv');

dotenv.config();

async function run() {
    console.log("--- Leaderboard Verification ---");

    const authUrl = 'http://localhost:3000/api/auth';
    const apiUrl = 'http://localhost:3000/api';

    // Helpers
    async function registerUser(name, email, school) {
        const res = await fetch(`${authUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: 'pass', role: 'student' }) // role ignored by register but whatever
        });
        if (res.status === 400) { // exists
            // login to get token
            const login = await fetch(`${authUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: 'pass' })
            });
            const data = await login.json();
            // update school
            await fetch(`${authUrl}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.token}`
                },
                body: JSON.stringify({ schoolName: school })
            });
            return data.token;
        }

        // New user
        const login = await fetch(`${authUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'pass' })
        });
        const data = await login.json();
        // update school
        await fetch(`${authUrl}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.token}`
            },
            body: JSON.stringify({ schoolName: school })
        });
        return data.token;
    }

    async function submitScore(token, score) {
        // Create a dummy test first or use existing? 
        // Let's create one via direct DB to succeed quickly
        // or just use existing.

        // We'll mock the Result creation directly to avoid test overhead
        // But since we are verifying API, we should use API.
        // We need a test ID.

        // Let's just create a test quickly with admin token.
        // ... (Skipping full test creation for brevity, assuming manual testing or pre-existing)

        // Alternative: Direct DB insertion for Verification speed
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const userId = decoded.id;

        const result = new Result({
            user: userId,
            test: new mongoose.Types.ObjectId(), // Dummy ID
            score: score,
            totalMarks: 100,
            accuracy: 80,
            timeTakenSeconds: 100,
            answers: []
        });
        await result.save();
    }

    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cettopper');

        // 1. Setup Users
        console.log("1. Setting up users...");
        const tokenA = await registerUser("Alice SchoolA", "alice@schoola.com", "School A");
        const tokenB = await registerUser("Bob SchoolA", "bob@schoola.com", "School A");
        const tokenC = await registerUser("Charlie SchoolB", "charlie@schoolb.com", "School B");

        // 2. Submit Scores
        console.log("2. Submitting scores...");
        await submitScore(tokenA, 90);
        await submitScore(tokenB, 80);
        await submitScore(tokenC, 95); // Highest score

        // 3. Fetch Leaderboard as Alice (School A)
        console.log("3. Fetching Leaderboard as Alice (School A)...");
        const res = await fetch(`${apiUrl}/leaderboard`, {
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });
        const data = await res.json();

        console.log("   Global Count:", data.global.length);
        console.log("   School Count:", data.school.length);

        // Verification
        // Global should have at least 3 (Alice, Bob, Charlie)
        // School should have 2 (Alice, Bob) - Charlie should NOT be there.

        const hasCharlieInSchool = data.school.find(u => u.name === "Charlie SchoolB");
        const hasAliceInSchool = data.school.find(u => u.name === "Alice SchoolA");

        if (!hasCharlieInSchool && hasAliceInSchool && data.school.length >= 2) {
            console.log("✅ SUCCESS: School Leaderboard filtered correctly.");
        } else {
            console.error("❌ FAILURE: School Leaderboard logic check failed.");
            console.log("School Data:", data.school.map(u => u.name));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
