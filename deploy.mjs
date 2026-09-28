import https from 'https';

const TOKEN = process.env.VERCEL_TOKEN;
if (!TOKEN) {
  console.error('VERCEL_TOKEN environment variable is not set.');
  process.exit(1);
}

const options = {
  hostname: 'api.vercel.com',
  path: '/v2/user',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'User-Agent': 'MPOnline-Deployer'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('User Info:', data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.end();
