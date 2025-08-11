const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle client-side routing - send all requests to index.html
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`- Local: http://localhost:${PORT}`);
});
