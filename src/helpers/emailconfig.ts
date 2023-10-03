// emailConfig.ts
import nodemailer, { Transporter } from 'nodemailer';
import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oAuth2Client:any = new google.auth.OAuth2({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: REDIRECT_URI,
});
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const smtpTransport: Transporter = nodemailer.createTransport({
    service: 'gmail', // Use Gmail service
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    refreshToken: REFRESH_TOKEN,
    accessToken: oAuth2Client.getAccessToken(),
  },
});

export default smtpTransport;
