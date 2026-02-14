// Native fetch is available in Node 18+

async function run() {
    const baseUrl = 'http://127.0.0.1:3000/api';
    const authUrl = 'http://127.0.0.1:3000/api/auth';

    // 1. Login as Admin
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

    // 2. Create Test
    console.log("--- 2. Create Test ---");
    const testPayload = {
        title: "Automated Admin Test",
        category: "Unit Test",
        subject: "Physics",
        totalMarks: 10,
        duration: 10,
        questions: [
            {
                text: "What is unit of Force?",
                options: ["Joule", "Newton", "Watt", "Pascal"],
                correctIndex: 2, // 'Newton' is index 1 (Option B), check Admin logic uses 1-based input or 0-based. 
                // Admin UI sends option value (1-4). Backend expects 0-based index? 
                // Let's check api.js: correctIndex: parseInt(q.correctIndex),
                // Admin UI sends 1-4. So we should send 1-4 here if reusing same logic? 
                // Wait, api.js logic:
                // questions: questions.map(q => ({ ... correctIndex: parseInt(q.correctIndex), ... }))
                // It does NOT subtract 1 in the API unless the UI sends 0-based.
                // Re-checking admin.html/js -> The UI logic does `parseInt(correctVal) - 1`. 
                // So the API receives 0-based index.
                // So here in verification script, we should send 0-based index directly if we hit API directly?
                // Actually, API just saves what it gets. So if UI sends 0-based, API saves 0-based.
                // Let's send 1 (index 1) which is Newton.
                correctIndex: 1
            }
        ]
    };

    const createRes = await fetch(`${baseUrl}/tests`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testPayload)
    });
    const createData = await createRes.json();
    console.log("Create Status:", createRes.status);
    const testId = createData.testId;

    if (testId) {
        console.log("Test ID:", testId);

        // 3. Verify it's in the list
        console.log("--- 3. List Tests ---");
        const listRes = await fetch(`${baseUrl}/tests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tests = await listRes.json();
        const found = tests.find(t => t._id === testId);
        console.log("Test Found in List:", !!found);

        // 4. Delete Test
        console.log("--- 4. Delete Test ---");
        const deleteRes = await fetch(`${baseUrl}/tests/${testId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const deleteData = await deleteRes.json();
        console.log("Delete Success:", deleteData.success);

        // 5. Verify it's gone
        const checkRes = await fetch(`${baseUrl}/tests/${testId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("Check Deleted (Should be 404):", checkRes.status);
    }
}

run().catch(console.error);
