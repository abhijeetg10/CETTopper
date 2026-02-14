// Native fetch in Node 18+
async function checkBackend() {
    try {
        console.log("Checking backend status...");
        const res = await fetch('http://localhost:3000/api/tests');

        if (res.ok) {
            const data = await res.json();
            console.log("Backend is UP! Status: " + res.status);
            console.log("Number of tests found:", data.length);

            if (data.length === 0) {
                console.log("Database is empty. Seeding...");
                const seedRes = await fetch('http://localhost:3000/api/seed', { method: 'POST' });
                const seedData = await seedRes.json();
                console.log("Seed result:", JSON.stringify(seedData));
            } else {
                console.log("Tests already exist:", JSON.stringify(data[0].title));
            }
        } else {
            console.log("Backend returned error:", res.status, res.statusText);
        }
    } catch (err) {
        console.error("Backend check failed (Is server running?):", err.message);
    }
}

checkBackend();
