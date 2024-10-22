const {google} = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:5173/google-cal/callback'
    );

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

module.exports = { oauth2Client, SCOPES};
