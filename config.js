/**
 * ===================================================================
 * MEOW 2D - CẤU HÌNH MẠNG NỘI BỘ VĂN PHÒNG (OFFICE LOCAL NETWORK CONFIG)
 * ===================================================================
 * 
 * Nơi lưu trữ toàn bộ cấu hình IP, Port và Network cho Meow 2D.
 * Bạn có thể dễ dàng thay đổi IP tại đây khi đổi mạng WiFi hoặc đổi máy host.
 */

const MEOW_CONFIG = {
  // IP của máy chủ chạy Meow 2D trong mạng WiFi / LAN công ty
  SERVER_IP: '10.10.150.163',

  // Cổng mạng (Port) để truy cập web và kết nối WebSocket
  PORT: 3333,

  // Bật/tắt tự động phân giải tên máy tính (Hostname) qua Reverse DNS
  ENABLE_REVERSE_DNS: true,

  // Thời gian hiển thị thông báo nổi từ dưới lên trước khi mờ đi (miligiây)
  NOTIFICATION_DURATION_MS: 4500,

  // Số lượng thông báo nổi tối đa hiển thị cùng lúc trên màn hình
  MAX_FLOATING_NOTIFICATIONS: 5,

  // Tần suất giới hạn gửi sự kiện vuốt ve để tránh spam mạng (ms)
  PET_THROTTLE_MS: 1200
};

// Hỗ trợ xuất cho Node.js server (CommonJS) và Trình duyệt Web (Browser)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MEOW_CONFIG;
}
if (typeof window !== 'undefined') {
  window.MEOW_CONFIG = MEOW_CONFIG;
}
