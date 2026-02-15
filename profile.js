document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // Load Profile
    await loadProfile(token);

    // Save Profile
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateProfile(token);
    });

    // Verify Mobile
    document.getElementById('verifyBtn').addEventListener('click', async () => {
        const otp = prompt("Enter OTP sent to your mobile (Simulated: Enter 1234)");
        if (!otp) return;

        try {
            const res = await fetch('/api/auth/verify-mobile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ otp })
            });
            const data = await res.json();
            if (data.success) {
                alert("Mobile Verified!");
                loadProfile(token); // Refresh UI
            } else {
                alert("Verification Failed: " + data.error);
            }
        } catch (err) {
            alert("Error: " + err.message);
        }
    });
});

async function loadProfile(token) {
    try {
        const res = await fetch('/api/auth/profile', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to load profile");

        const user = await res.json();

        document.getElementById('name').value = user.name;
        document.getElementById('email').value = user.email;
        document.getElementById('mobile').value = user.mobile || '';
        document.getElementById('schoolName').value = user.schoolName || '';
        document.getElementById('className').value = user.className || '';

        // Update Sidebar Mini Profile
        const sidebarName = document.querySelector('.user-mini-profile div[style*="font-weight: 600"]');
        const sidebarAvatar = document.querySelector('.user-avatar');
        if (sidebarName) sidebarName.innerText = user.name;
        if (sidebarAvatar) sidebarAvatar.innerText = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        // Mobile Verification Status
        const statusSpan = document.getElementById('mobileStatus');
        const verifyBtn = document.getElementById('verifyBtn');
        const mobileInput = document.getElementById('mobile');

        if (user.mobile && user.isMobileVerified) {
            statusSpan.innerHTML = '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>';
            verifyBtn.style.display = 'none';
        } else if (user.mobile) {
            statusSpan.innerHTML = '<span class="unverified-badge"><i class="fas fa-times-circle"></i> Unverified</span>';
            verifyBtn.style.display = 'block';
        } else {
            statusSpan.innerHTML = '';
            verifyBtn.style.display = 'none';
        }

    } catch (err) {
        console.error(err);
        alert("Session expired or error loading data.");
        // window.location.href = 'login.html';
    }
}

async function updateProfile(token) {
    const mobile = document.getElementById('mobile').value;
    const schoolName = document.getElementById('schoolName').value;
    const className = document.getElementById('className').value;

    try {
        const res = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ mobile, schoolName, className })
        });

        const data = await res.json();
        if (data.success) {
            alert("Profile Updated Successfully!");
            loadProfile(token);
        } else {
            alert("Update Failed: " + data.error);
        }

    } catch (err) {
        alert("Error: " + err.message);
    }
}
