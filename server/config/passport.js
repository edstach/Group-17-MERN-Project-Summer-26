const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let existingUser = await User.findOne({ googleId: profile.id });

            if (existingUser) {
                return done(null, existingUser);
            }

            const newUser = new User({
                googleId: profile.id,
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                login: profile.emails[0].value,
                isVerified: true
            });

            await newUser.save();
            done(null, newUser);
        } catch (err) {
            done(err, null);
        }
    }
    ));
}