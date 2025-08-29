// // testFirebaseIdToken.js
// const axios = require("axios");
// const admin = require("firebase-admin");
// require('dotenv').config();

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(require("./my-firebase-key.json"))
//   });
// }

// async function getIdToken() {
//   try {
//     // Step 1: Create a custom token for a test user
//     const customToken = await admin.auth().createCustomToken("test-uid");
//     console.log("Custom Token:", customToken);

//     // Step 2: Exchange the custom token for an ID token using Firebase REST API
//     const apiKey = process.env.FIREBASE_API_KEY; // put your Firebase Web API key in .env
//     const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;

//     const response = await axios.post(url, {
//       token: customToken,
//       returnSecureToken: true
//     });

//     console.log("ID Token (use this for backend requests):", response.data.idToken);
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//   }
// }

// getIdToken();

// firebase.js
const admin = require("firebase-admin");
const path = require("path");

// Load service account
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

// Initialize once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;


