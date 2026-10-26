/**
 * ===================================================================
 * MEOW 2D - VIRTUAL OFFICE CAT LOCAL SERVER
 * ===================================================================
 * 
 * Server Node.js phục vụ game Meow 2D qua mạng LAN/WiFi công ty.
 * Tích hợp WebSocket phát hiện IP + Tên máy tính (Hostname) và broadcast
 * thông báo thời gian thực khi có ai tương tác với mèo.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
const { WebSocketServer, WebSocket } = require('ws');
const config = require('./config.js');

const PORT = config.PORT || 3000;
const PUBLIC_DIR = __dirname;
const TOOLS_DIR = path.join(PUBLIC_DIR, 'tools');

// Kết nối từ chính máy này (localhost IPv4/IPv6)
function isLoopback(addr) {
  return addr === '::1' || /^(::ffff:)?127\./.test(addr || '');
}

// MIME types thông dụng
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg'
};

// Cache lưu trữ tên máy tính đã phân giải từ IP
const hostnameCache = new Map();

/**
 * Trích xuất địa chỉ IP sạch từ request
 */
function extractClientIp(req) {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  // Loại bỏ IPv6 prefix ::ffff:
  ip = ip.replace(/^.*:/, '');
  if (ip === '1' || ip === '') ip = '127.0.0.1';
  return ip;
}

/**
 * Phân giải tên máy tính (Hostname) từ địa chỉ IP qua Reverse DNS
 */
async function resolveHostname(ip) {
  if (ip === '127.0.0.1' || ip === 'localhost') {
    return 'Máy Chủ (Host)';
  }
  if (!config.ENABLE_REVERSE_DNS) {
    return ip;
  }
  if (hostnameCache.has(ip)) {
    return hostnameCache.get(ip);
  }

  return new Promise((resolve) => {
    // Giới hạn timeout 1.5 giây để tránh treo nếu router không hỗ trợ PTR record
    const timer = setTimeout(() => {
      hostnameCache.set(ip, ip);
      resolve(ip);
    }, 1500);

    dns.reverse(ip, (err, hostnames) => {
      clearTimeout(timer);
      if (!err && hostnames && hostnames.length > 0) {
        // Lấy tên máy ngắn gọn trước dấu chấm (bỏ .domain.local nếu có)
        const rawName = hostnames[0].split('.')[0];
        hostnameCache.set(ip, rawName);
        resolve(rawName);
      } else {
        hostnameCache.set(ip, ip);
        resolve(ip);
      }
    });
  });
}

// 1. Tạo HTTP Server phục vụ file tĩnh
const server = http.createServer((req, res) => {
  // CORS & Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Phục vụ API kiểm tra IP/Tên máy tính trực tiếp
  if (req.url === '/api/my-info') {
    const clientIp = extractClientIp(req);
    resolveHostname(clientIp).then(hostname => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        ip: clientIp,
        hostname: hostname,
        serverIp: config.SERVER_IP,
        port: PORT
      }));
    });
    return;
  }

  // Parse static file path
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, reqPath);

  // Bảo vệ không cho đọc ra ngoài thư mục dự án
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  // Công cụ phát triển (Cat Lab) chỉ mở cho chính máy chạy server. Dùng địa chỉ socket thật,
  // không dùng x-forwarded-for vì header đó giả được.
  if (filePath.startsWith(TOOLS_DIR) && !isLoopback(req.socket.remoteAddress)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden: Cat Lab chỉ dùng trên máy local (http://localhost)');
    return;
  }

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
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

// 2. Tạo WebSocket Server
const wss = new WebSocketServer({ server });
const connectedClients = new Map();

/**
 * Broadcast tin nhắn tới tất cả client đang kết nối
 */
function broadcast(messageObj) {
  const payload = JSON.stringify(messageObj);
  for (const [ws, info] of connectedClients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

wss.on('connection', async (ws, req) => {
  const clientIp = extractClientIp(req);
  const hostname = await resolveHostname(clientIp);
  const clientId = 'c_' + Math.random().toString(36).substring(2, 9);

  const clientInfo = {
    id: clientId,
    ip: clientIp,
    hostname: hostname,
    nickname: '',
    connectedAt: Date.now()
  };

  connectedClients.set(ws, clientInfo);

  const displayName = hostname !== clientIp ? `${hostname} (${clientIp})` : clientIp;
  console.log(`[+] [KẾT NỐI MỚI] ${displayName} vừa vào phòng. Tổng online: ${connectedClients.size}`);

  // Gửi thông điệp chào mừng và thông tin máy cho chính client đó
  ws.send(JSON.stringify({
    type: 'welcome',
    clientId: clientId,
    ip: clientIp,
    hostname: hostname,
    onlineCount: connectedClients.size,
    serverIp: config.SERVER_IP
  }));

  // Báo cho mọi người có bạn mới tham gia
  broadcast({
    type: 'system_broadcast',
    message: `💻 [${displayName}] vừa mở phòng nuôi mèo!`,
    onlineCount: connectedClients.size
  });

  // Xử lý các thông điệp từ client gửi lên
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      // 1. Cập nhật Biệt danh (Nickname) do người dùng tự đặt
      if (msg.type === 'set_nickname') {
        const nick = (msg.nickname || '').trim().substring(0, 30);
        clientInfo.nickname = nick;
        ws.send(JSON.stringify({
          type: 'nickname_updated',
          nickname: nick
        }));
        return;
      }

      // 2. Sự kiện tương tác với mèo (Vuốt ve, Cho ăn, Chơi đồ chơi, Đổi nón, v.v.)
      if (msg.type === 'action') {
        const currentDisplayName = clientInfo.nickname 
          ? `${clientInfo.nickname} (${clientInfo.hostname !== clientInfo.ip ? clientInfo.hostname : clientInfo.ip})`
          : (clientInfo.hostname !== clientInfo.ip ? `${clientInfo.hostname} [${clientInfo.ip}]` : `[${clientInfo.ip}]`);

        const actionBroadcast = {
          type: 'action_broadcast',
          id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          senderId: clientInfo.id,
          clientIp: clientInfo.ip,
          hostname: clientInfo.hostname,
          nickname: clientInfo.nickname,
          displayName: currentDisplayName,
          actionType: msg.actionType || 'interact', // 'pet', 'feed', 'toy', 'outfit', 'sleep', 'room', 'rename'
          detail: msg.detail || 'vừa tương tác với mèo',
          icon: msg.icon || '🐾',
          themeColor: msg.themeColor || '#f43f5e',
          timestamp: Date.now()
        };

        console.log(`[*] [ACTION] ${currentDisplayName}: ${actionBroadcast.detail}`);

        // Broadcast tới TẤT CẢ mọi người để cùng nổi thông báo từ dưới lên
        broadcast(actionBroadcast);
      }
    } catch (err) {
      console.error('[!] Lỗi xử lý tin nhắn client:', err);
    }
  });

  // Xử lý khi ngắt kết nối
  ws.on('close', () => {
    connectedClients.delete(ws);
    console.log(`[-] [RỜI PHÒNG] ${displayName} đã thoát. Còn lại: ${connectedClients.size}`);

    broadcast({
      type: 'user_left',
      onlineCount: connectedClients.size
    });
  });

  ws.on('error', (err) => {
    console.error(`[!] Lỗi kết nối client (${clientIp}):`, err.message);
  });
});

// 3. Khởi động Server
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n=============================================================');
  console.log('🐾 MEOW 2D - VIRTUAL OFFICE CAT LOCAL SERVER ĐANG CHẠY! 🐱');
  console.log('=============================================================');
  console.log(`🌐 Cổng mạng (Port):      ${PORT}`);
  console.log(`🏠 Chơi trên máy này:     http://localhost:${PORT}`);
  console.log(`🏢 Chia sẻ trong WiFi:    http://${config.SERVER_IP}:${PORT}`);
  console.log(`⚙️  File cấu hình IP:      config.js`);
  console.log('-------------------------------------------------------------');
  console.log('👉 Gửi link "http://' + config.SERVER_IP + ':' + PORT + '" cho đồng nghiệp cùng mạng WiFi là chơi chung!');
  console.log('=============================================================\n');
});
