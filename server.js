const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// In-Memory Multiplayer Rooms
const rooms = new Map();

function getRoomData(room) {
  if (!room) return null;
  return {
    id: room.id,
    players: room.players,
    createdAt: room.createdAt
  };
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const pathname = parsedUrl.pathname;

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // ------------------------------------------
  // Real-Time Multiplayer Room API
  // ------------------------------------------
  if (pathname === '/api/room/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let data = {};
      try { data = JSON.parse(body || '{}'); } catch(e) {}
      
      const words = ['NUSA', 'RAJA', 'BALI', 'JAWA', 'SUMA', 'PURA', 'BATU', 'KITA'];
      const code = words[Math.floor(Math.random() * words.length)] + Math.floor(100 + Math.random() * 900);
      
      const room = {
        id: code,
        players: [{
          id: 0,
          name: data.name || 'Pemain 1',
          accessory: data.accessory || 'mahkota',
          isAI: false
        }],
        clients: [],
        createdAt: Date.now()
      };
      rooms.set(code, room);
      sendJson(res, 200, { success: true, roomId: code, playerIndex: 0, room: getRoomData(room) });
    });
    return;
  }

  if (pathname === '/api/room/join' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let data = {};
      try { data = JSON.parse(body || '{}'); } catch(e) {}
      const code = (data.roomId || '').toUpperCase().trim();
      const room = rooms.get(code);

      if (!room) {
        sendJson(res, 404, { success: false, message: 'Ruangan tidak ditemukan! Periksa kembali kode.' });
        return;
      }

      if (room.players.length >= 4) {
        sendJson(res, 400, { success: false, message: 'Ruangan sudah penuh (maksimal 4 pemain)!' });
        return;
      }

      const pIndex = room.players.length;
      const newPlayer = {
        id: pIndex,
        name: data.name || `Pemain ${pIndex + 1}`,
        accessory: data.accessory || 'caping',
        isAI: false
      };
      room.players.push(newPlayer);

      // Broadcast player joined to existing clients
      room.clients.forEach(c => {
        try {
          c.write(`data: ${JSON.stringify({ type: 'PLAYER_JOINED', player: newPlayer, players: room.players })}\n\n`);
        } catch(e) {}
      });

      sendJson(res, 200, { success: true, roomId: code, playerIndex: pIndex, room: getRoomData(room) });
    });
    return;
  }

  if (pathname === '/api/room/action' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let data = {};
      try { data = JSON.parse(body || '{}'); } catch(e) {}
      const code = (data.roomId || '').toUpperCase().trim();
      const room = rooms.get(code);

      if (!room) {
        sendJson(res, 404, { success: false, message: 'Ruangan tidak ditemukan.' });
        return;
      }

      // Broadcast action to all clients
      const msg = `data: ${JSON.stringify(data.action)}\n\n`;
      room.clients.forEach(c => {
        try { c.write(msg); } catch(e) {}
      });

      sendJson(res, 200, { success: true });
    });
    return;
  }

  if (pathname === '/api/room/events') {
    const code = (parsedUrl.searchParams.get('roomId') || '').toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Room not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    room.clients.push(res);
    res.write(`data: ${JSON.stringify({ type: 'ROOM_SYNC', room: getRoomData(room) })}\n\n`);

    req.on('close', () => {
      const idx = room.clients.indexOf(res);
      if (idx !== -1) room.clients.splice(idx, 1);
      if (room.clients.length === 0) {
        // Expire empty room after 10 minutes
        setTimeout(() => {
          if (room.clients.length === 0) rooms.delete(code);
        }, 600000);
      }
    });
    return;
  }

  // ------------------------------------------
  // Static File Serving
  // ------------------------------------------
  let reqPath = pathname;
  if (reqPath === '/') reqPath = '/index.html';
  
  const filePath = path.join(__dirname, reqPath);
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
