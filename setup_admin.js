const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./models/Schema');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cettopper';

async function createAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const email = "argaikwad24@gmail.com";
        const password = "AdminAbhi@2026#CETTopper";

        // Check if exists
        let admin = await User.findOne({ email });
        if (admin) {
            console.log("Admin already exists. Updating role...");
            admin.role = 'admin';
            await admin.save();
            console.log("Admin role ensured.");
        } else {
            console.log("Creating new Admin...");
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            admin = new User({
                name: "Super Admin",
                email: email,
                password: hashedPassword,
                role: 'admin'
            });
            await admin.save();
            console.log("Admin created successfully.");
        }

        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

createAdmin();
