const express = require('express');
const axios = require('axios');
const app = express();

// ==========================================
// CONFIGURATION (UPDATE THESE VALUES)
// ==========================================
const CLIENT_ID = '01KZ4DP5SFJS1FHGD6XASY89TF';
const CLIENT_SECRET = '74d7589975b1b84501783953e97e0c029ae7d39e796a417446e9d7ab65914b7d';

// Your live GitHub Pages URL (Where your index.html is hosted)
const GITHUB_PAGES_URL = 'https://realfishh.github.io/KickTool';

// Your server callback URL (Must match what you register on Kick)
const REDIRECT_URI = 'https://103.151.40.47:3000/auth/kick/callback';
// ==========================================

// 1. Redirect user to Kick OAuth login page
app.get('/auth/kick', (req, res) => {
    const kickAuthUrl = `https://id.kick.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=user:read`;
    res.redirect(kickAuthUrl);
});

// 2. Handle Kick callback, exchange code for token, and fetch user profile
app.get('/auth/kick/callback', async (req, res) => {
    const authCode = req.query.code;
    if (!authCode) {
        return res.status(400).send('Authorization code missing.');
    }

    try {
        // Securely exchange code for access token using client secret
        const tokenResponse = await axios.post('https://id.kick.com/oauth/token', {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: authCode,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI
        });

        const accessToken = tokenResponse.data.access_token;

        // Fetch user information from Kick API
        const userResponse = await axios.get('https://api.kick.com/v1/users', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const user = userResponse.data;

        // Redirect back to your GitHub Pages site with the user data attached in the URL
        res.redirect(`${GITHUB_PAGES_URL}/?username=${encodeURIComponent(user.name)}&avatar=${encodeURIComponent(user.profile_pic)}`);
        
    } catch (error) {
        console.error('OAuth Error:', error.response?.data || error.message);
        res.status(500).send('Authentication failed during token exchange.');
    }
});

// Start server on port 3000
app.listen(3000, () => {
    console.log('Kick OAuth server running on port 3000');
});