const express = require('express');
const axios = require('axios');
const app = express();

// ==========================================
// CONFIGURATION
// ==========================================
const CLIENT_ID = '01KZ4DP5SFJS1FHGD6XASY89TF';
const CLIENT_SECRET = '74d7589975b1b84501783953e97e0c029ae7d39e796a417446e9d7ab65914b7d';

// Your live GitHub Pages URL (Where your index.html is hosted)
const GITHUB_PAGES_URL = 'https://kicktool.pages.dev';

// Your live Render Server Callback URL
const REDIRECT_URI = 'https://kicktool.onrender.com/auth/kick/callback';
// ==========================================

// 1. Redirect user to Kick OAuth login page (Scope removed to allow dashboard defaults)
app.get('/auth/kick', (req, res) => {
    const kickAuthUrl = `https://id.kick.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&state=security_state_123`;
    res.redirect(kickAuthUrl);
});

// 2. Handle Kick callback, exchange code for token, and fetch user profile
app.get('/auth/kick/callback', async (req, res) => {
    const authCode = req.query.code;
    if (!authCode) {
        return res.status(400).send('Authorization code missing.');
    }

    try {
        const tokenResponse = await axios.post('https://id.kick.com/oauth/token', {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: authCode,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI
        });

        const accessToken = tokenResponse.data.access_token;

        const userResponse = await axios.get('https://api.kick.com/v1/users', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const user = userResponse.data;

        res.redirect(`${GITHUB_PAGES_URL}/?username=${encodeURIComponent(user.name)}&avatar=${encodeURIComponent(user.profile_pic)}`);
        
    } catch (error) {
        console.error('OAuth Error:', error.response?.data || error.message);
        res.status(500).send('Authentication failed during token exchange.');
    }
});

// Render assigns a dynamic port, fall back to 3000 locally
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Kick OAuth server running on port ${PORT}`);
});
