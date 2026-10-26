/**
 * ===================================================================
 * MEOW 2D - OFFICE NETWORK CLIENT & FLOATING ACTION STREAM
 * ===================================================================
 * 
 * Quản lý kết nối WebSocket thời gian thực tới server nội bộ.
 * Nhận diện IP, Tên máy tính (Hostname) và tạo hiệu ứng thông báo
 * nổi từ đáy màn hình lên trên mỗi khi có tương tác trong công ty.
 */

class OfficeNetworkClient {
  constructor() {
    this.config = window.MEOW_CONFIG || {
      SERVER_IP: '10.10.150.163',
      PORT: 3000,
      NOTIFICATION_DURATION_MS: 4500,
      MAX_FLOATING_NOTIFICATIONS: 5,
      PET_THROTTLE_MS: 1200
    };

    this.ws = null;
    this.isConnected = false;
    this.clientId = null;
    this.myIp = 'Đang nhận diện...';
    this.myHostname = '';
    this.myNickname = localStorage.getItem('meow_office_nickname') || '';
    this.onlineCount = 1;
    this.lastPetBroadcast = 0;

    this.streamContainer = null;
    this.initUI();
    this.connect();
  }

  /**
   * Khởi tạo container hiển thị thông báo nổi từ dưới lên và thanh trạng thái
   */
  initUI() {
    // 1. Container cho các thông báo nổi từ dưới lên
    if (!document.getElementById('office-action-stream')) {
      this.streamContainer = document.createElement('div');
      this.streamContainer.id = 'office-action-stream';
      this.streamContainer.className = 'office-action-stream';
      document.body.appendChild(this.streamContainer);
    } else {
      this.streamContainer = document.getElementById('office-action-stream');
    }

    // 2. Thanh trạng thái kết nối mạng văn phòng ở góc trên màn hình
    if (!document.getElementById('office-network-bar')) {
      const netBar = document.createElement('div');
      netBar.id = 'office-network-bar';
      netBar.className = 'office-network-bar ui-interactive';
      netBar.innerHTML = `
        <div class="net-status-dot pulse" id="net-status-dot"></div>
        <div class="net-status-text">
          <span id="net-online-count">Đang kết nối...</span>
          <span class="net-divider">•</span>
          <span id="net-my-device" class="net-device-tag" title="Bấm để đổi tên hiển thị của bạn">
            💻 <span id="net-my-name-display">Đang nhận diện IP...</span> ✏️
          </span>
        </div>
      `;
      document.body.appendChild(netBar);

      // Cho phép bấm vào để đổi biệt danh hiển thị
      netBar.addEventListener('click', (e) => {
        if (e.target.closest('#net-my-device') || e.target.id === 'net-my-device') {
          this.promptEditNickname();
        }
      });
    }
  }

  /**
   * Kết nối tới WebSocket server
   */
  connect() {
    // Xác định địa chỉ kết nối WebSocket
    let wsHost = '';
    if (window.location.protocol.startsWith('http') && window.location.host) {
      wsHost = window.location.host; // Sử dụng ngay host đang mở web (tự động đúng cho cả localhost lẫn IP)
    } else {
      wsHost = `${this.config.SERVER_IP}:${this.config.PORT}`;
    }

    const wsUrl = `ws://${wsHost}`;
    console.log(`[OfficeNetwork] Đang kết nối tới ${wsUrl}...`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.updateStatusDot(true);
        console.log('[OfficeNetwork] ✅ Đã kết nối thành công tới máy chủ văn phòng!');

        // Gửi biệt danh đã lưu nếu có
        if (this.myNickname) {
          this.send({ type: 'set_nickname', nickname: this.myNickname });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (e) {
          console.error('[OfficeNetwork] Lỗi parse tin nhắn:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.updateStatusDot(false);
        console.warn('[OfficeNetwork] Mất kết nối. Đang thử kết nối lại sau 3 giây...');
        setTimeout(() => this.connect(), 3000);
      };

      this.ws.onerror = (err) => {
        this.isConnected = false;
        this.updateStatusDot(false);
        console.error('[OfficeNetwork] Lỗi WebSocket:', err);
      };
    } catch (err) {
      console.error('[OfficeNetwork] Không thể khởi tạo WebSocket:', err);
      setTimeout(() => this.connect(), 4000);
    }
  }

  /**
   * Cập nhật màu sắc trạng thái kết nối
   */
  updateStatusDot(connected) {
    const dot = document.getElementById('net-status-dot');
    const onlineEl = document.getElementById('net-online-count');
    if (!dot || !onlineEl) return;

    if (connected) {
      dot.className = 'net-status-dot connected';
      onlineEl.textContent = `🟢 Online: ${this.onlineCount} máy`;
    } else {
      dot.className = 'net-status-dot disconnected';
      onlineEl.textContent = '🔴 Ngoại tuyến (Đang kết nối lại...)';
    }
  }

  /**
   * Xử lý gói tin nhận được từ Server
   */
  handleMessage(msg) {
    switch (msg.type) {
      case 'welcome':
        this.clientId = msg.clientId;
        this.myIp = msg.ip;
        this.myHostname = msg.hostname;
        this.onlineCount = msg.onlineCount || 1;
        this.updateMyDeviceDisplay();
        this.updateStatusDot(true);
        break;

      case 'user_joined':
      case 'user_left':
        if (msg.onlineCount !== undefined) {
          this.onlineCount = msg.onlineCount;
          this.updateStatusDot(this.isConnected);
        }
        break;

      case 'system_broadcast':
        if (msg.onlineCount !== undefined) {
          this.onlineCount = msg.onlineCount;
          this.updateStatusDot(this.isConnected);
        }
        if (msg.message) {
          this.spawnSystemNotice(msg.message);
        }
        break;

      case 'action_broadcast':
        // Hiển thị thông báo nổi từ dưới lên cho mọi người cùng thấy
        this.renderFloatingActionCard(msg);
        break;

      case 'nickname_updated':
        this.myNickname = msg.nickname;
        localStorage.setItem('meow_office_nickname', msg.nickname);
        this.updateMyDeviceDisplay();
        break;
    }
  }

  /**
   * Cập nhật nhãn hiển thị thiết bị của chính mình trên thanh top bar
   */
  updateMyDeviceDisplay() {
    const displayEl = document.getElementById('net-my-name-display');
    if (!displayEl) return;

    let text = '';
    if (this.myNickname) {
      text = `${this.myNickname} [${this.myHostname || this.myIp}]`;
    } else if (this.myHostname && this.myHostname !== this.myIp) {
      text = `${this.myHostname} (${this.myIp})`;
    } else {
      text = `${this.myIp}`;
    }
    displayEl.textContent = text;
  }

  /**
   * Cho phép người dùng click để đặt Biệt danh cho máy mình
   */
  promptEditNickname() {
    const current = this.myNickname || '';
    const newNick = window.prompt(
      'Nhập Tên / Biệt danh hiển thị của bạn trong văn phòng:\n(Ví dụ: Tuấn Backend, Linh QA, Hoàng PM,...)',
      current
    );

    if (newNick !== null) {
      const cleanNick = newNick.trim();
      this.myNickname = cleanNick;
      localStorage.setItem('meow_office_nickname', cleanNick);
      this.updateMyDeviceDisplay();

      if (this.isConnected) {
        this.send({ type: 'set_nickname', nickname: cleanNick });
      }
      if (window.showToast) {
        window.showToast(`✨ Đã đổi tên hiển thị thành: <b>${cleanNick || 'Mặc định theo IP/Tên máy'}</b>!`);
      }
    }
  }

  /**
   * Gửi dữ liệu an toàn lên server
   */
  send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  /**
   * Gửi sự kiện tương tác lên server để broadcast cho cả văn phòng
   * @param {string} actionType - 'pet' | 'feed' | 'toy' | 'outfit' | 'sleep' | 'room' | 'rename'
   * @param {string} detail - Mô tả ngắn (ví dụ: 'Cho mèo ăn Cá Hồi')
   * @param {string} icon - Emoji icon (ví dụ: '🍣', '❤️', '🧶')
   * @param {string} themeColor - Mã màu viền phát sáng (ví dụ: '#f43f5e')
   */
  broadcastAction(actionType, detail, icon = '🐾', themeColor = '#f43f5e') {
    // Nếu là vuốt ve thì áp dụng throttle để tránh spam hàng chục tin/giây
    if (actionType === 'pet') {
      const now = Date.now();
      if (now - this.lastPetBroadcast < (this.config.PET_THROTTLE_MS || 1200)) {
        return; // Bỏ qua nếu vuốt quá nhanh
      }
      this.lastPetBroadcast = now;
    }

    if (!this.isConnected) return;

    this.send({
      type: 'action',
      actionType: actionType,
      detail: detail,
      icon: icon,
      themeColor: themeColor
    });
  }

  /**
   * Tạo thẻ thông báo NỔI TỪ DƯỚI LÊN (Bottom-Up Floating Notification Card)
   */
  renderFloatingActionCard(data) {
    if (!this.streamContainer) return;

    // Giới hạn số lượng thẻ hiển thị cùng lúc
    const maxCards = this.config.MAX_FLOATING_NOTIFICATIONS || 5;
    while (this.streamContainer.children.length >= maxCards) {
      const oldest = this.streamContainer.firstChild;
      if (oldest) oldest.remove();
    }

    const isMe = data.senderId === this.clientId;
    const card = document.createElement('div');
    card.className = `floating-action-card ${isMe ? 'is-self' : ''}`;
    card.style.setProperty('--card-glow-color', data.themeColor || '#f43f5e');

    // Tách tên máy và IP để định dạng đẹp mắt
    const hasHostname = data.hostname && data.hostname !== data.clientIp;
    const machineTag = hasHostname 
      ? `<span class="card-hostname">💻 ${this.escapeHtml(data.hostname)}</span>` 
      : `<span class="card-hostname">🌐 ${this.escapeHtml(data.clientIp)}</span>`;
    
    const ipTag = hasHostname 
      ? `<span class="card-ip">[${this.escapeHtml(data.clientIp)}]</span>` 
      : '';

    const nickTag = data.nickname 
      ? `<span class="card-nickname">👤 ${this.escapeHtml(data.nickname)}</span>` 
      : '';

    const selfTag = isMe ? `<span class="card-badge-self">Bạn</span>` : '';

    card.innerHTML = `
      <div class="card-icon-wrapper" style="border-color: ${data.themeColor || '#f43f5e'}">
        <span class="card-icon">${data.icon || '🐾'}</span>
      </div>
      <div class="card-body">
        <div class="card-header-row">
          ${nickTag}
          ${machineTag}
          ${ipTag}
          ${selfTag}
        </div>
        <div class="card-detail-text">
          ${data.detail}
        </div>
      </div>
      <div class="card-pulse-indicator"></div>
    `;

    // Thêm vào container (thẻ mới chèn vào phía dưới)
    this.streamContainer.appendChild(card);

    // Kích hoạt animation xuất hiện
    requestAnimationFrame(() => {
      card.classList.add('animate-in');
    });

    // Tự động mờ dần và bay lên rồi xóa sau khoảng thời gian cài đặt
    const duration = this.config.NOTIFICATION_DURATION_MS || 4500;
    setTimeout(() => {
      card.classList.remove('animate-in');
      card.classList.add('animate-out');
      setTimeout(() => {
        if (card.parentElement) {
          card.remove();
        }
      }, 500);
    }, duration);
  }

  /**
   * Thông báo hệ thống nhẹ nhàng
   */
  spawnSystemNotice(msg) {
    if (!this.streamContainer) return;
    const card = document.createElement('div');
    card.className = 'floating-action-card system-card';
    card.innerHTML = `
      <div class="card-icon-wrapper system-icon">⚡</div>
      <div class="card-body">
        <div class="card-detail-text">${this.escapeHtml(msg)}</div>
      </div>
    `;
    this.streamContainer.appendChild(card);
    requestAnimationFrame(() => card.classList.add('animate-in'));
    setTimeout(() => {
      card.classList.remove('animate-in');
      card.classList.add('animate-out');
      setTimeout(() => card.remove(), 500);
    }, 3800);
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }
}

// Khởi tạo instance toàn cục ngay khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  window.officeNetwork = new OfficeNetworkClient();
});
