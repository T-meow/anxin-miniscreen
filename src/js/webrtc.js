/**
 * 安心小屏 - 视频通话 & 远程监控
 * WebRTC 音视频通话 + 静默监控（无需老人端确认）
 */

const WebRTC = {
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  isInCall: false,
  isCaller: false,
  isMonitoring: false,
  monitorStream: null,

  // 演示模式配置
  demoMode: true,

  init() {
    this.setupEventListeners();
    return this;
  },

  // 设置事件监听
  setupEventListeners() {
    // 子女端发起通话
    const callBtn = document.getElementById('btn-call');
    if (callBtn) {
      callBtn.addEventListener('click', () => this.initiateCall());
    }

    // 子女端发起监控
    const monitorBtn = document.getElementById('btn-monitor');
    if (monitorBtn) {
      monitorBtn.addEventListener('click', () => this.startMonitor());
    }
  },

  // ========== 视频通话 ==========

  // 发起通话（子女端）
  initiateCall() {
    if (this.demoMode) {
      this.showCallOverlay('calling');
      return;
    }

    this.isCaller = true;
    this.showCallOverlay('calling');
    this.startLocalStream().then(() => {
      this.createPeerConnection();
      this.createOffer();
    });
  },

  // 显示通话覆盖层
  showCallOverlay(state) {
    const modal = document.getElementById('modal-layer');
    modal.classList.add('active');

    if (state === 'calling') {
      modal.innerHTML = `
        <div class="call-overlay active">
          <div class="call-avatar">👵</div>
          <h2>正在呼叫陈阿姨...</h2>
          <p>等待对方接听</p>
          <div class="call-actions">
            <button class="call-btn hangup" onclick="WebRTC.endCall()">📞</button>
          </div>
        </div>
      `;

      if (this.demoMode) {
        setTimeout(() => {
          this.simulateIncomingCall();
        }, 2000);
      }
    } else if (state === 'incoming') {
      modal.innerHTML = `
        <div class="call-overlay active">
          <div class="call-avatar">👨</div>
          <h2>儿子来电</h2>
          <p>视频通话</p>
          <div class="call-actions">
            <button class="call-btn answer" onclick="WebRTC.answerCall()">📞</button>
            <button class="call-btn hangup" onclick="WebRTC.rejectCall()">📞</button>
          </div>
        </div>
      `;
      this.playRingtone();
    } else if (state === 'connected') {
      this.setPrivacyActive(true);
      modal.innerHTML = `
        <div class="call-overlay active" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);">
          <div style="text-align: center;">
            <div class="call-avatar" style="width: 120px; height: 120px; font-size: 60px;">👨</div>
            <h2>通话中</h2>
            <p id="call-timer">00:00</p>
          </div>
          <div class="call-actions">
            <button class="call-btn hangup" onclick="WebRTC.endCall()">📞</button>
          </div>
        </div>
      `;
      this.startCallTimer();
    }
  },

  // 模拟老人端来电（演示模式）
  simulateIncomingCall() {
    const elderModeBtn = document.querySelector('[data-mode="elder"]');
    if (elderModeBtn) elderModeBtn.click();

    setTimeout(() => {
      this.showCallOverlay('incoming');
    }, 500);
  },

  // 接听通话
  answerCall() {
    this.stopRingtone();
    this.showCallOverlay('connected');
    if (!this.demoMode) {
      this.createAnswer();
    }
  },

  // 拒绝通话
  rejectCall() {
    this.stopRingtone();
    this.closeOverlay();
    this.setPrivacyActive(false);
  },

  // 结束通话
  endCall() {
    this.stopRingtone();
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }
    this.closeOverlay();
    this.setPrivacyActive(false);

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.isInCall = false;
    this.isCaller = false;
  },

  // 关闭覆盖层
  closeOverlay() {
    const modal = document.getElementById('modal-layer');
    modal.innerHTML = '';
    modal.classList.remove('active');
  },

  // ========== 远程监控 ==========

  // 开始监控（子女端发起，无需老人确认）
  startMonitor() {
    if (this.isMonitoring) return;

    // 如果正在通话，先结束通话
    if (this.isInCall) {
      this.endCall();
    }

    this.showMonitorOverlay('connecting');

    if (this.demoMode) {
      // 演示模式：模拟连接过程
      setTimeout(() => {
        this.simulateMonitorConnected();
      }, 2000);
      return;
    }

    // 真实 WebRTC 监控流程
    this.isMonitoring = true;
    this.startLocalStream().then(() => {
      // 创建单向连接（只接收老人端画面）
      this.createMonitorConnection();
    }).catch(err => {
      console.error('监控连接失败:', err);
      this.stopMonitor();
      alert('无法连接老人端摄像头，请检查设备状态。');
    });
  },

  // 停止监控
  stopMonitor() {
    this.isMonitoring = false;

    // 关闭监控覆盖层
    const overlay = document.getElementById('monitor-overlay');
    if (overlay) {
      overlay.innerHTML = '';
      overlay.classList.remove('active');
    }

    // 关闭老人端隐私提示
    this.setPrivacyBar(false);

    // 停止媒体流
    if (this.monitorStream) {
      this.monitorStream.getTracks().forEach(track => track.stop());
      this.monitorStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // 更新监控卡片状态
    const statusEl = document.getElementById('monitor-status');
    const hintEl = document.getElementById('monitor-hint');
    if (statusEl) statusEl.textContent = '未连接';
    if (hintEl) hintEl.textContent = '点击查看老人端实时画面';
  },

  // 显示监控覆盖层
  showMonitorOverlay(state) {
    // 创建或获取覆盖层
    let overlay = document.getElementById('monitor-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'monitor-overlay';
      overlay.className = 'monitor-overlay';
      document.body.appendChild(overlay);
    }

    if (state === 'connecting') {
      overlay.innerHTML = `
        <div class="monitor-overlay-header">
          <span style="font-size: 15px; font-weight: 700;">远程监控</span>
          <button class="btn-secondary" style="background: rgba(255,255,255,0.15); color: white; border: none; padding: 8px 16px;" onclick="WebRTC.stopMonitor()">
            <svg viewBox="0 0 20 20" width="14" height="14"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            关闭
          </button>
        </div>
        <div class="monitor-overlay-body">
          <div class="monitor-feed">
            <div class="monitor-feed-placeholder">
              <div class="placeholder-icon">
                <svg viewBox="0 0 40 40" width="36" height="36"><circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="16" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 34c0-6.6 5.4-12 12-12s12 5.4 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </div>
              <p style="font-size: 18px;">正在连接老人端摄像头...</p>
              <div class="calling-dots" style="margin-top: 16px; justify-content: center;"><span></span><span></span><span></span></div>
            </div>
          </div>
        </div>
      `;
      overlay.classList.add('active');
    } else if (state === 'connected') {
      overlay.innerHTML = `
        <div class="monitor-overlay-header">
          <div class="monitor-badge">
            <svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>
            正在监控
          </div>
          <button class="btn-secondary" style="background: rgba(255,255,255,0.15); color: white; border: none; padding: 8px 16px;" onclick="WebRTC.stopMonitor()">
            <svg viewBox="0 0 20 20" width="14" height="14"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            关闭
          </button>
        </div>
        <div class="monitor-overlay-body">
          <div class="monitor-feed">
            <div class="monitor-feed-placeholder">
              <div class="placeholder-icon">
                <svg viewBox="0 0 40 40" width="36" height="36"><circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="16" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 34c0-6.6 5.4-12 12-12s12 5.4 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </div>
              <p style="font-size: 18px;">陈阿姨的客厅</p>
              <p style="font-size: 14px; margin-top: 4px;">画面实时传输中</p>
            </div>
          </div>
        </div>
        <div class="monitor-overlay-footer">
          <div class="monitor-speak-row">
            <button class="btn-mic" onclick="WebRTC.startMonitorVoice()" title="语音喊话">
              <svg viewBox="0 0 20 20" width="18" height="18"><path d="M10 2a3 3 0 013 3v4a3 3 0 01-6 0V5a3 3 0 013-3z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 9v1a5 5 0 0010 0V9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="15" x2="10" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
            <input type="text" id="monitor-speak-input" placeholder="输入喊话内容，老人端会听到..."
              onkeypress="if(event.key==='Enter')WebRTC.sendMonitorSpeak()">
            <button class="btn-send" onclick="WebRTC.sendMonitorSpeak()" title="发送">
              <svg viewBox="0 0 20 20" width="18" height="18"><path d="M4 10l12-6-6 6-6 6 6-6z" fill="currentColor"/></svg>
            </button>
          </div>
          <p class="monitor-hint">喊话内容会以语音形式播报给老人</p>
        </div>
      `;
      overlay.classList.add('active');
    }
  },

  // 模拟监控连接成功（演示模式）
  simulateMonitorConnected() {
    this.isMonitoring = true;

    // 切换到老人端显示隐私提示（如果当前在子女端）
    if (App.currentMode !== 'elder') {
      App.switchToElder();
      setTimeout(() => {
        this.setPrivacyBar(true);
        // 切回子女端显示监控
        App.switchToFamily(true);
        this.showMonitorOverlay('connected');
        this.updateMonitorStatus('已连接');
      }, 600);
    } else {
      this.setPrivacyBar(true);
      this.showMonitorOverlay('connected');
      this.updateMonitorStatus('已连接');
    }
  },

  // 更新监控卡片状态
  updateMonitorStatus(status) {
    const statusEl = document.getElementById('monitor-status');
    const hintEl = document.getElementById('monitor-hint');
    if (statusEl) statusEl.textContent = status;
    if (hintEl) {
      hintEl.textContent = status === '已连接' ? '点击重新连接' : '点击查看老人端实时画面';
    }
  },

  // 发送喊话（文字输入）
  sendMonitorSpeak() {
    const input = document.getElementById('monitor-speak-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    // 在老人端语音播报
    this.speakOnElder(text);

    // 清空输入框
    input.value = '';

    // 显示发送成功提示（可选）
    const hint = document.querySelector('.monitor-hint');
    if (hint) {
      const oldText = hint.textContent;
      hint.textContent = '已发送：' + text;
      setTimeout(() => { hint.textContent = oldText; }, 2000);
    }
  },

  // 语音喊话
  startMonitorVoice() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('您的设备不支持语音输入，请使用文字输入。');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      const btn = document.querySelector('.btn-mic');
      if (btn) btn.style.background = 'var(--danger)';
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const input = document.getElementById('monitor-speak-input');
      if (input) {
        input.value = transcript;
        this.sendMonitorSpeak();
      }
    };

    recognition.onerror = () => {
      alert('语音识别出错，请重试或使用文字输入。');
    };

    recognition.onend = () => {
      const btn = document.querySelector('.btn-mic');
      if (btn) btn.style.background = '';
    };

    recognition.start();
  },

  // 在老人端语音播报
  speakOnElder(text) {
    // 确保在老人端播放
    const savedMode = App.currentMode;

    const doSpeak = () => {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('子女喊话：' + text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.85;
        utterance.pitch = 1.1;
        speechSynthesis.speak(utterance);
      }
    };

    if (savedMode !== 'elder') {
      App.switchToElder();
      setTimeout(() => {
        doSpeak();
        // 3秒后切回原界面
        setTimeout(() => {
          if (savedMode === 'family') {
            App.switchToFamily(true);
          }
        }, 3000);
      }, 300);
    } else {
      doSpeak();
    }
  },

  // 设置隐私状态（老人端顶部提示条）
  setPrivacyBar(active) {
    const bar = document.getElementById('privacy-bar');
    const text = document.getElementById('privacy-bar-text');

    if (active) {
      if (bar) bar.classList.add('active');
      if (text) text.textContent = '摄像头正在使用中 - 子女正在远程看护';
    } else {
      if (bar) bar.classList.remove('active');
    }
  },

  // 设置隐私状态（旧方法，视频通话用）
  setPrivacyActive(active) {
    State.set('privacyActive', active);
    // 复用新的隐私条
    this.setPrivacyBar(active);
  },

  // ========== 通用工具 ==========

  // 播放铃声
  playRingtone() {
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      this.ringtoneInterval = setInterval(() => {
        this.playBeep();
      }, 1000);
    }
  },

  playBeep() {
    if (!this.audioContext) return;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.3;
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.2);
  },

  stopRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  },

  // 通话计时器
  startCallTimer() {
    if (this.callTimer) clearInterval(this.callTimer);
    let seconds = 0;
    const timerEl = document.getElementById('call-timer');
    this.callTimer = setInterval(() => {
      seconds++;
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      if (timerEl) timerEl.textContent = `${mins}:${secs}`;
    }, 1000);
  },

  // 启动本地媒体流
  async startLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      return this.localStream;
    } catch (err) {
      console.error('获取媒体设备失败:', err);
      alert('无法访问摄像头和麦克风，请检查权限设置。');
      throw err;
    }
  },

  // 创建 RTCPeerConnection
  createPeerConnection() {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    this.peerConnection = new RTCPeerConnection(config);

    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({ type: 'ice', candidate: event.candidate });
      }
    };
  },

  // 创建监控专用连接（单向接收）
  createMonitorConnection() {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };

    this.peerConnection = new RTCPeerConnection(config);

    this.peerConnection.ontrack = (event) => {
      this.monitorStream = event.streams[0];
      const videoEl = document.getElementById('monitor-video');
      if (videoEl) {
        videoEl.srcObject = this.monitorStream;
      }
    };
  },

  // 创建 Offer
  async createOffer() {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.sendSignal({ type: 'offer', sdp: offer });
  },

  // 创建 Answer
  async createAnswer() {
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    this.sendSignal({ type: 'answer', sdp: answer });
  },

  // 发送信令
  sendSignal(data) {
    console.log('发送信令:', data);
  },

  // 接收信令
  handleSignal(data) {
    if (data.type === 'offer') {
      this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
      this.createAnswer();
    } else if (data.type === 'answer') {
      this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } else if (data.type === 'ice') {
      this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }
};
