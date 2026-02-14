// Standalone Verification Script
async function run() {
    console.log("--- Profile Verification ---");

    const authUrl = 'http://localhost:3000/api/auth';

    // 1. Login
    console.log("1. Logging in...");
    const loginRes = await fetch(`${authUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'argaikwad24@gmail.com', password: 'AdminAbhi@2026#CETTopper' })
    });

    if (!loginRes.ok) {
        console.error("Login failed:", await loginRes.text());
        process.exit(1);
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("   Login Success");

    // 2. Update Profile
    console.log("2. Updating Profile...");
    const updateRes = await fetch(`${authUrl}/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            mobile: '9876543210',
            schoolName: 'Test School',
            className: '12th'
        })
    });

    const updateData = await updateRes.json();
    if (updateData.success) {
        console.log("   Update Success");
    } else {
        console.error("   Update Failed:", updateData);
        process.exit(1);
    }

    // 3. Verify Mobile
    console.log("3. Verifying Mobile...");
    const verifyRes = await fetch(`${authUrl}/verify-mobile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp: '1234' })
    });
    const verifyData = await verifyRes.json();
    if (verifyData.success) {
        console.log("   Mobile Verification Success");
    } else {
        console.error("   Mobile Verification Failed");
    }

    // 4. Fetch Profile to Confirm
    console.log("4. Fetching Profile...");
    const getRes = await fetch(`${authUrl}/profile`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const profile = await getRes.json();

    if (profile.mobile === '9876543210' && profile.isMobileVerified === true && profile.schoolName === 'Test School') {
        console.log("✅ SUCCESS: Profile flow verified.");
    } else {
        console.error("❌ FAILURE: Profile data mismatch.");
        console.log("Got:", profile);
    }
}

run();
