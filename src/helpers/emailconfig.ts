// import nodemailer, { Transporter } from 'nodemailer';
// import { google } from 'googleapis';
// import dotenv from 'dotenv';
// import { GaxiosError } from 'gaxios'; // Import GaxiosError
// dotenv.config();

// const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
// const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
// const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// const oAuth2Client: any = new google.auth.OAuth2({
//   clientId: CLIENT_ID,
//   clientSecret: CLIENT_SECRET,
//   redirectUri: REDIRECT_URI,
// });
// oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// // Generate the OAuth2 URL with the desired scope
// const authUrl = oAuth2Client.generateAuthUrl({
//   access_type: 'offline', // Request an offline access token
//   scope: SCOPES,
// });
// //console.log('Authorize this app by visiting this URL:', authUrl);

// const smtpTransport: Transporter = nodemailer.createTransport({
//   service: 'gmail', // Use Gmail service
//   auth: {
//     type: 'OAuth2',
//     user: process.env.EMAIL,
//     clientId: CLIENT_ID,
//     clientSecret: CLIENT_SECRET,
//     refreshToken: REFRESH_TOKEN,
//     accessToken: oAuth2Client.getAccessToken(),
//   },
// });

// // Implement error handling and logging
// smtpTransport.verify((error, success) => {
//   if (error) {
//     console.error('SMTP Transport Error:', error);

//     // Check if the error is a GaxiosError
//     if (error instanceof GaxiosError) {
//       console.error('GaxiosError:', error.response?.data || error.message);
//     }

//     throw error;
//   } else {
//     console.log('SMTP Transport is ready');
//   }
// });

// export default smtpTransport;
