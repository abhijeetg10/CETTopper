const mongoose = require('mongoose');
const { Test, Result } = require('./models/Schema');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cet_topper';

async function clearData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB.');

        const tests = await Test.deleteMany({});
        console.log(`Deleted ${tests.deletedCount} tests.`);

        const results = await Result.deleteMany({});
        console.log(`Deleted ${results.deletedCount} results.`);

        console.log('Data cleanup complete.');
    } catch (err) {
        console.error('Error clearing data:', err);
    } finally {
        await mongoose.connection.close();
    }
}

clearData();
