// verify_analytics.js
// Native fetch in Node 18+

async function run() {
    const baseUrl = 'http://127.0.0.1:3000/api';
    const authUrl = 'http://127.0.0.1:3000/api/auth';

    console.log("--- 1. Login Admin ---");
    const loginRes = await fetch(`${authUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "admin@cet.com", password: "adminpassword" })
    });
    const authData = await loginRes.json();
    if (!authData.success) {
        console.error("Login Failed:", authData);
        return;
    }
    const token = authData.token;
    console.log("Admin Token Received");

    // 2. Fetch Users
    console.log("--- 2. Fetch Users ---");
    const usersRes = await fetch(`${baseUrl}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const users = await usersRes.json();
    console.log(`Users Found: ${users.length}`);
    if (users.length > 0) {
        console.log("Sample User:", users[0]);
    }

    // 3. Fetch Results
    console.log("--- 3. Fetch Results ---");
    const resultsRes = await fetch(`${baseUrl}/admin/results`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const results = await resultsRes.json();
    console.log(`Results Found: ${results.length}`);
    if (results.length > 0) {
        console.log("Sample Result:", results[0]);
    }
}

run().catch(console.error);
