const mongoose = require('mongoose');

// --- 1. Question Schema (Embedded in Test) ---
const QuestionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: [{ type: String, required: true }], // Array of strings
    correctIndex: { type: Number, required: true, select: false }, // HIDE from client by default!
    marks: { type: Number, default: 2 },
    explanation: { type: String }
});

// --- 2. Test Schema ---
const TestSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, enum: ['Full Length', 'Unit Test', 'Chapter', 'Subject'], required: true },
    subject: { type: String }, // e.g., 'Physics', 'PCM'
    totalMarks: { type: Number, required: true },
    durationMovies: { type: Number, default: 180 }, // in minutes
    questions: [QuestionSchema],
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    isPublished: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

// --- 3. User Schema ---
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // In real app, hash this!
    role: { type: String, enum: ['student', 'admin'], default: 'student' }, // For commercial scale
    subscriptionStatus: { type: String, enum: ['free', 'premium'], default: 'free' },
    mobile: { type: String },
    isMobileVerified: { type: Boolean, default: false },
    schoolName: { type: String },
    className: { type: String },
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// --- 4. Result/Attempt Schema ---
const ResultSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    score: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    accuracy: { type: Number }, // Percentage
    timeTakenSeconds: { type: Number },
    violationCount: { type: Number, default: 0 }, // Proctoring violations
    answers: [{ // Store user's specific answers for analytics
        questionId: mongoose.Schema.Types.ObjectId,
        selectedOption: Number,
        isCorrect: Boolean
    }],
    completedAt: { type: Date, default: Date.now }
});

const SystemSettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // e.g., 'examDate'
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = {
    Test: mongoose.model('Test', TestSchema),
    User: mongoose.model('User', UserSchema),
    Result: mongoose.model('Result', ResultSchema),
    SystemSetting: mongoose.model('SystemSetting', SystemSettingSchema)
};
