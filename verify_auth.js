// Native fetch (Node 18+)
async function run() {
    const email = "user" + Date.now() + "@test.com";
    const password = "password123";
    const baseUrl = 'http://127.0.0.1:3000/api/auth';

    console.log("1. Registering...");
    try {
        const r1 = await fetch(`${baseUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Tester', email, password })
        });

        const text = await r1.text();
        console.log("Response Status:", r1.status);
        console.log("Response Body:", text);

        if (r1.ok) {
            console.log("2. Logging in...");
            const r2 = await fetch(`${baseUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const d2 = await r2.json();
            console.log("Login Response:", d2);
        }
    } catch (e) {
        console.error("Link fail:", e.message);
    }
}

run();
