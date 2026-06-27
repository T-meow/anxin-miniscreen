/**
 * 安心小屏 - 视频通话
 * WebRTC 音视频通话，包含来电、接听、隐私提示完整流程
 */

const WebRTC = {
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  isInCall: false,
  isCaller: false,

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
  },

  // 发起通话（子女端）
  initiateCall() {
    if (this.demoMode) {
      this.showCallOverlay('calling');
      return;
    }

    // 真实 WebRTC 流程
    this.isCaller = true;
    this.showCallOverlay('calling');
    this.startLocalStream().then(() => {
      this.createPeerConnection();
      // 创建 offer 并发送给信令服务器
      this.createOffer();
    });
  },

  // 显示通话覆盖层
  showCallOverlay(state) {
    const modal = document.getElementById('modal-layer');
    modal.classList.add('active');

    if (state === 'calling') {
      // 子女端：正在呼叫
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

      // 演示模式：3秒后模拟老人端来电
      if (this.demoMode) {
        setTimeout(() => {
          this.simulateIncomingCall();
        }, 2000);
      }
    } else if (state === 'incoming') {
      // 老人端：来电
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

      // 播放来电铃声
      this.playRingtone();
    } else if (state === 'connected') {
      // 通话中
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
    // 切换到老人端
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

  // 设置隐私状态
  setPrivacyActive(active) {
    State.set('privacyActive', active);
    const strip = document.getElementById('privacy-strip');
    const text = document.getElementById('privacy-text');

    if (active) {
      strip.classList.add('active');
      text.textContent = '摄像头和麦克风正在使用 - 视频通话中';
    } else {
      strip.classList.remove('active');
      text.textContent = '摄像头和麦克风未使用';
    }
  },

  // 播放铃声
  playRingtone() {
    // 使用 Web Audio API 生成简单铃声
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

    // 添加本地流
    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    // 接收远程流
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
    };

    // ICE 候选
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // 发送给信令服务器
        this.sendSignal({ type: 'ice', candidate: event.candidate });
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
    // 实际项目中通过 WebSocket 发送
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
