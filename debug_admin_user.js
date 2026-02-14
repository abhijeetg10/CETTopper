const mongoose = require('mongoose');
const { User } = require('./models/Schema');
const dotenv = require('dotenv');

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cettopper';

async function checkAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        const admin = await User.findOne({ email: 'admin@cet.com' });
        console.log("Admin User:", admin);
        if (admin && admin.role !== 'admin') {
            console.log("FIXING ROLE...");
            admin.role = 'admin';
            await admin.save();
            console.log("Role Fixed.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAdmin();
