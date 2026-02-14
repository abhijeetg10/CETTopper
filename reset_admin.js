const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./models/Schema');
const dotenv = require('dotenv');

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cettopper';

const newEmail = process.argv[2];
const newPassword = process.argv[3];

if (!newEmail || !newPassword) {
    console.log("Usage: node reset_admin.js <new_email> <new_password>");
    process.exit(1);
}

async function resetAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Find existing admin or create new
        // We look for any user with role 'admin', or specifically the old email
        let admin = await User.findOne({ role: 'admin' });

        if (!admin) {
            console.log("No existing admin found. Creating new one...");
            admin = new User({
                name: "Admin",
                role: 'admin'
            });
        } else {
            console.log(`Found existing admin: ${admin.email}`);
        }

        // Update credentials
        admin.email = newEmail;
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(newPassword, salt);

        await admin.save();

        console.log("🎉 Admin Credentials Updated Successfully!");
        console.log(`New Email: ${newEmail}`);
        console.log(`New Password: ${newPassword}`);

        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}

resetAdmin();
