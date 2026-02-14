const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Test, User, Result } = require('./models/Schema');

dotenv.config();

// Native fetch is available in Node 24
// If not, we'd need node-fetch, but user has Node 24.

async function runVerification() {
    console.log("--- Security Verification Script ---");

    const baseUrl = 'http://localhost:3000/api';
    const authUrl = 'http://localhost:3000/api/auth';

    try {
        // 1. Login
        console.log("1. Logging in...");
        const loginRes = await fetch(`${authUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'argaikwad24@gmail.com',
                password: 'AdminAbhi@2026#CETTopper'
            })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("   Login Success. Token acquired.");

        // 2. Create Test
        console.log("2. Creating Dummy Test...");
        const testRes = await fetch(`${baseUrl}/tests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: "Security Verification Test",
                category: "Unit Test",
                subject: "Physics",
                totalMarks: 4,
                duration: 5,
                questions: [
                    {
                        text: "Q1",
                        options: ["A", "B", "C", "D"],
                        correctIndex: 0,
                        marks: 2
                    },
                    {
                        text: "Q2",
                        options: ["A", "B", "C", "D"],
                        correctIndex: 1,
                        marks: 2
                    }
                ]
            })
        });

        if (!testRes.ok) throw new Error(`Create Test failed: ${testRes.statusText}`);
        const testData = await testRes.json();
        // Handle various response formats (sometimes it's {_id: ...} directly or {test: {_id...}})
        const testId = testData._id || testData.test?._id;
        console.log(`   Test Created: ${testId}`);

        // 3. Submit with Violations
        console.log("3. Submitting Test with 7 Violations...");
        const submitRes = await fetch(`${baseUrl}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                testId: testId,
                userAnswers: { 0: 0, 1: 1 }, // All correct
                timeTaken: 100,
                violationCount: 7
            })
        });

        const submitData = await submitRes.json();
        console.log("   Submit Response:", JSON.stringify(submitData));

        // 4. Check Database
        console.log("4. Verifying DB Record...");
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cettopper');

        // Find the result we just created. 
        // We can find by testId. The user is the admin (since we logged in as admin).
        const result = await Result.findOne({ test: testId })
            .sort({ completedAt: -1 })
            .populate('user');

        if (!result) {
            console.error("❌ No result found in DB!");
        } else {
            console.log(`   Found Result for user: ${result.user.email}`);
            console.log(`   Violation Count in DB: ${result.violationCount}`);

            if (result.violationCount === 7) {
                console.log("✅ SUCCESS: Violation count matches!");
            } else {
                console.error("❌ FAILURE: Violation count mismatch.");
            }
        }

        // Cleanup
        console.log("5. Cleaning up...");
        await Test.findByIdAndDelete(testId);
        if (result) await Result.findByIdAndDelete(result._id);
        console.log("   Cleanup complete.");

    } catch (err) {
        console.error("❌ Error During Verification:", err);
    } finally {
        await mongoose.disconnect();
    }
}

runVerification();
