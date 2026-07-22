const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    login: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
    },
    googleId: {
        type: String
    },
    isVerified: {
        type: Boolean, default: false
    },
    verificationToken: {
        type: String
    }
});

module.exports = mongoose.model('User', userSchema);