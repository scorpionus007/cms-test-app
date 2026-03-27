/**
 * Serve redirect-consent demo page on port 5501.
 * Run: npm run test:redirect
 * Then open: http://localhost:5501
 */
const path = require('path');
const express = require('express');

const app = express();
const PORT = 5501;
const ROOT = path.resolve(__dirname, '../..');

app.use(express.static(ROOT, { index: false }));

app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT, 'demo-apps', 'redirect-consent-demo.html'));
});

app.listen(PORT, () => {
  console.log(`Redirect consent demo: http://localhost:${PORT}`);
  console.log('(API should be running on http://localhost:3000)');
});
