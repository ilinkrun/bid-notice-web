const http = require('http');
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');

const server = http.createServer((req, res) => {
  // CORS 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/upload') {
    console.log('📁 Direct Node.js upload started');

    // formidable로 파일 파싱 (크기 제한 100MB)
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB
      uploadDir: path.join(__dirname, 'public', 'uploads'),
      keepExtensions: true,
      filename: (name, ext, part) => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${timestamp}-${random}${ext}`;
      }
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Upload error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }

      const file = files.file && files.file[0];
      if (!file) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No file uploaded' }));
        return;
      }

      console.log('✅ File uploaded:', {
        originalName: file.originalFilename,
        size: file.size,
        path: file.filepath
      });

      const fileName = path.basename(file.filepath);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        url: `/uploads/${fileName}`,
        filename: file.originalFilename,
        size: file.size
      }));
    });

  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 11502;
server.listen(PORT, () => {
  console.log(`🚀 Direct upload server running on port ${PORT}`);
  console.log(`📁 Upload endpoint: http://localhost:${PORT}/upload`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down upload server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});