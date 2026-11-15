import express from 'express';
import open from 'open';
import fetch from 'node-fetch';
import 'dotenv/config';

const app = express();
const port = 3003;

const CLIENT_ID = process.env.PINTEREST_APP_ID;
const CLIENT_SECRET = process.env.PINTEREST_APP_SECRET;
const REDIRECT_URI = `http://localhost:${port}/callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: PINTEREST_APP_ID and PINTEREST_APP_SECRET must be in .env');
  process.exit(1);
}

// Scopes needed for writing
const SCOPES = 'boards:read,boards:write,pins:read,pins:write';

const authUrl = `https://www.pinterest.com/oauth/?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${SCOPES}`;

app.get('/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    res.send('Authorization failed.');
    return;
  }

  console.log('📡 Code received, exchanging for token...');

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI
    })
  });

  const data: any = await response.json();

  if (data.access_token) {
    console.log('\n✅ SUCCESS! Here is your Write-Enabled Access Token:\n');
    console.log(data.access_token);
    console.log('\nPaste this into your .env as PINTEREST_ACCESS_TOKEN\n');
    res.send('Success! Check your terminal for the token.');
    setTimeout(() => process.exit(0), 1000);
  } else {
    console.error('❌ Token exchange failed:', data);
    res.send(`Error: ${JSON.stringify(data)}`);
  }
});

app.listen(port, () => {
  console.log(`\n🔑 Pinterest Auth Helper started.`);
  console.log(`🔗 Opening browser to authorize with Write Scopes...`);
  console.log(`\nIf the browser doesn't open, go to: ${authUrl}\n`);
  open(authUrl);
});
