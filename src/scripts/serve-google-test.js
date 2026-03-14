/**
 * Serve the Google login test page on port 5500.
 * Run: npm run test:google
 * Then open: http://localhost:5500 or http://localhost:5500/test-google-login.html
 *
 * Keep the API running on port 3000. CORS already allows http://localhost:5500.
 */
const path = require('path');
const express = require('express');

const app = express();
const PORT = 5500;
const ROOT = path.resolve(__dirname, '../..');

app.use(express.static(ROOT, { index: false }));

app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT, 'test-google-login.html'));
});

app.listen(PORT, () => {
  console.log(`Google login test page: http://localhost:${PORT}`);
  console.log(`(API should be running on http://localhost:3000)`);
});
