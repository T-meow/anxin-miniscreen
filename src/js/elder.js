/**
 * 安心小屏 - 老人端交互
 * 处理大按钮点击，打开全屏功能弹窗
 */

const Elder = {
  currentView: null,

  init() {
    this.setupActionButtons();
    this.setupPanelBack();
    this.initMascot();
    return this;
  },

  // 设置大按钮点击事件（设置保留全屏面板，其他用弹窗）
  setupActionButtons() {
    const buttons = document.querySelectorAll('.elder-action');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (view === 'settings' || view === 'emergency') {
          this.openPanel(view);
        } else {
          this.openModal(view);
        }
      });
    });
  },

  // 设置弹窗返回按钮
  setupPanelBack() {
    const backBtn = document.getElementById('panel-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.closePanel());
    }
  },

  // 打开全屏功能弹窗
  openPanel(view) {
    this.currentView = view;
    const panel = document.getElementById('fullscreen-panel');
    const title = document.getElementById('panel-title');
    const body = document.getElementById('panel-body');

    const titleMap = {
      assistant: '问助手',
      entertainment: '听一会儿',
      reminders: '今日提醒',
      family: '呼叫家人',
      settings: '简单设置'
    };

    title.textContent = titleMap[view] || '功能';

    // 紧急联系和设置走不同逻辑
    if (view === 'emergency') {
      this.showEmergency();
      return;
    }

    switch (view) {
      case 'assistant':
        Assistant.show();
        break;
      case 'entertainment':
        Entertainment.show();
        break;
      case 'reminders':
        Reminders.showPanel();
        break;
      case 'family':
        this.renderFamilyInfo(body);
        break;
      case 'settings':
        this.renderSettings(body);
        break;
      default:
        body.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 40px;">功能开发中</p>';
    }

    panel.classList.add('active');
  },

  // 关闭全屏弹窗
  closePanel() {
    const panel = document.getElementById('fullscreen-panel');
    panel.classList.remove('active');
    this.currentView = null;
  },

  // 打开居中弹窗（用于问助手、听一会儿、今日提醒、呼叫家人）
  openModal(view) {
    this.currentView = view;
    const modal = document.getElementById('modal-layer');

    const titleMap = {
      assistant: '问助手',
      entertainment: '听一会儿',
      reminders: '今日提醒',
      family: '呼叫家人'
    };

    modal.classList.add('active');
    modal.innerHTML = `
      <div class="modal-box modal-large" id="modal-content-box">
        <div class="modal-header">
          <h3>${titleMap[view] || '功能'}</h3>
          <button class="btn-close" onclick="Elder.closeModal()" aria-label="关闭">✕</button>
        </div>
        <div class="modal-content" id="modal-content-body"></div>
      </div>
    `;

    // 点击背景关闭
    modal.onclick = (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    };

    switch (view) {
      case 'assistant':
        Assistant.show();
        break;
      case 'entertainment':
        Entertainment.show();
        break;
      case 'reminders':
        Reminders.showPanel();
        break;
      case 'family':
        this.renderFamilyInfo(this.getPanelBody());
        break;
    }
  },

  // 获取弹窗内容容器（优先返回 modal 内容区）
  getPanelBody() {
    const modalBody = document.getElementById('modal-content-body');
    if (modalBody) return modalBody;
    return document.getElementById('panel-body');
  },

  // 渲染家人信息（在弹窗内）
  renderFamilyInfo(container) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="padding: 18px; background: var(--bg2); border-radius: 14px; display: flex; align-items: center; gap: 16px;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 30px; flex-shrink: 0;">👨</div>
          <div style="flex: 1;">
            <strong style="font-size: 20px;">儿子</strong>
            <p style="margin: 4px 0 0; color: var(--muted);">138****8888</p>
          </div>
          <button class="btn-primary" style="padding: 12px 20px; font-size: 16px;" onclick="WebRTC.initiateCall()">视频通话</button>
        </div>
        <div style="padding: 18px; background: var(--bg2); border-radius: 14px; display: flex; align-items: center; gap: 16px;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--accent2); display: flex; align-items: center; justify-content: center; font-size: 30px; flex-shrink: 0;">👩</div>
          <div style="flex: 1;">
            <strong style="font-size: 20px;">女儿</strong>
            <p style="margin: 4px 0 0; color: var(--muted);">139****6666</p>
          </div>
          <button class="btn-primary" style="padding: 12px 20px; font-size: 16px;" onclick="WebRTC.initiateCall()">视频通话</button>
        </div>
        <!-- 语音留言入口 -->
        <div style="padding: 18px; background: #f0f7ff; border-radius: 14px; border: 1px solid #cfe2ff;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--brand); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <svg viewBox="0 0 20 20" width="22" height="22" style="color: white;"><path d="M10 2a3 3 0 013 3v4a3 3 0 01-6 0V5a3 3 0 013-3z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 9v1a5 5 0 0010 0V9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="15" x2="10" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </div>
              <div>
                <strong style="font-size: 18px;">给子女留言</strong>
                <p style="margin: 2px 0 0; color: var(--muted); font-size: 14px;">按住说话，松开发送</p>
              </div>
            </div>
            <button class="btn-primary" id="btn-voice-record" style="padding: 12px 20px; font-size: 16px; border-radius: 50%; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;"
              onmousedown="Elder.startVoiceRecord()" onmouseup="Elder.stopVoiceRecord()" ontouchstart="Elder.startVoiceRecord()" ontouchend="Elder.stopVoiceRecord()">
              <svg viewBox="0 0 20 20" width="24" height="24"><path d="M10 2a3 3 0 013 3v4a3 3 0 01-6 0V5a3 3 0 013-3z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 9v1a5 5 0 0010 0V9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="15" x2="10" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>
          <div id="voice-record-status" style="margin-top: 10px; font-size: 14px; color: var(--brand); text-align: center; display: none;">正在录音...</div>
        </div>
      </div>
    `;
  },

  // 渲染设置（在弹窗内）
  renderSettings(container) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="padding: 18px; background: var(--bg2); border-radius: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 18px;">语音播报</strong>
            <button class="btn-secondary" style="padding: 10px 20px; font-size: 16px;" onclick="this.textContent=this.textContent==='开'?'关':'开'">开</button>
          </div>
          <p style="margin: 6px 0 0; color: var(--muted); font-size: 15px;">提醒和回复时自动朗读</p>
        </div>
        <div style="padding: 18px; background: var(--bg2); border-radius: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 18px;">字体大小</strong>
            <div style="display: flex; gap: 8px;">
              <button class="btn-secondary" style="padding: 8px 16px; font-size: 15px;">小</button>
              <button class="btn-secondary" style="padding: 8px 16px; font-size: 15px; background: var(--accent); color: white; border-color: var(--accent);">大</button>
              <button class="btn-secondary" style="padding: 8px 16px; font-size: 15px;">特大</button>
            </div>
          </div>
        </div>
        <div style="padding: 18px; background: var(--bg2); border-radius: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 18px;">屏幕常亮</strong>
            <button class="btn-secondary" style="padding: 10px 20px; font-size: 16px;" onclick="this.textContent=this.textContent==='开'?'关':'开'">开</button>
          </div>
          <p style="margin: 6px 0 0; color: var(--muted); font-size: 15px;">保持屏幕一直亮着</p>
        </div>

        <!-- 默认模式 -->
        <div style="padding: 18px; background: var(--bg2); border-radius: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 18px;">默认进入子女端</strong>
              <p style="margin: 4px 0 0; color: var(--muted); font-size: 15px;">每次打开直接显示子女端界面</p>
            </div>
            <button class="btn-secondary toggle-btn" id="toggle-default-family"
              style="padding: 10px 20px; font-size: 16px; min-width: 52px;"
              onclick="Elder.toggleDefaultMode(this)">${localStorage.getItem('anxin_default_role') === 'family' ? '已开启' : '已关闭'}</button>
          </div>
        </div>

        <!-- 子女端入口 -->
        <div style="padding: 18px; background: #fff8f0; border-radius: 14px; border: 1px solid var(--accent);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 18px;">进入子女端</strong>
              <p style="margin: 4px 0 0; color: var(--muted); font-size: 15px;">切换到子女端，管理提醒和查看状态</p>
            </div>
            <button class="btn-primary" style="padding: 10px 20px; font-size: 16px;" onclick="App.switchToFamily()">进入</button>
          </div>
        </div>

        <!-- 摔倒检测设置 -->
        <div style="padding: 18px; background: var(--bg2); border-radius: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 18px;">摔倒检测</strong>
              <p style="margin: 4px 0 0; color: var(--muted); font-size: 15px;">检测到意外摔倒时自动求助</p>
            </div>
            <button class="btn-secondary toggle-btn" id="toggle-fall-detection"
              style="padding: 10px 20px; font-size: 16px; min-width: 52px;"
              onclick="Elder.toggleFallDetection(this)">${State.get('fallDetectionEnabled') !== false ? '已开启' : '已关闭'}</button>
          </div>
          <button class="btn-secondary" style="margin-top: 10px; padding: 10px 16px; font-size: 14px; color: var(--danger); border-color: var(--danger);"
            onclick="Elder.testFallDetection()">模拟摔倒测试</button>
        </div>

        <button class="btn-secondary" style="margin-top: 8px; padding: 12px 20px; font-size: 15px;" onclick="App.resetRole()">重新选择角色</button>
      </div>
    `;
  },

  // 紧急联系（使用模态框，因为需要醒目提示）
  showEmergency() {
    const modal = document.getElementById('modal-layer');
    modal.classList.add('active');
    modal.innerHTML = `
        <div class="modal-box emergency-box">
          <h3>紧急联系</h3>
          <p>遇到紧急情况，请选择联系人：</p>
          <div class="modal-actions" style="flex-direction: column;">
            <button class="btn-primary full" onclick="Elder.callEmergency('120')">🚑 拨打 120 急救</button>
            <button class="btn-primary full" style="background: var(--accent2);" onclick="Elder.callEmergency('son')">📞 联系儿子</button>
            <button class="btn-secondary" onclick="Elder.closeModal()">取消</button>
        </div>
      </div>
    `;
  },

  // 拨打紧急电话
  callEmergency(type) {
    const label = type === '120' ? '120 急救中心' : '儿子';
    const modal = document.getElementById('modal-layer');
    modal.classList.add('active');
    modal.innerHTML = `
      <div class="call-overlay emergency-call active">
        <div class="call-avatar emergency-avatar">${type === '120' ? '🚑' : '👨'}</div>
        <h2>正在呼叫${label}</h2>
        <p>请不要关闭页面，保持手机在身边</p>
        <div class="calling-dots" aria-hidden="true"><span></span><span></span><span></span></div>
        <div class="call-actions">
          <button class="call-btn hangup" onclick="Elder.closeModal()" aria-label="挂断">📞</button>
        </div>
      </div>
    `;
    setTimeout(() => {
      const title = modal.querySelector('h2');
      const desc = modal.querySelector('p');
      if (title) title.textContent = `已通知${label}`;
      if (desc) desc.textContent = '这是一段演示流程：家人会看到紧急联系提示。';
    }, 2500);
  },

  // 关闭模态框
  closeModal() {
    const modal = document.getElementById('modal-layer');
    modal.innerHTML = '';
    modal.classList.remove('active');
    modal.onclick = null;
    this.currentView = null;
  },

  // 切换默认模式（老人端/子女端）
  toggleDefaultMode(btn) {
    const current = localStorage.getItem('anxin_default_role');
    if (current === 'family') {
      localStorage.setItem('anxin_default_role', 'elder');
      btn.textContent = '已关闭';
      btn.style.background = 'var(--bg)';
      btn.style.color = 'var(--ink)';
    } else {
      localStorage.setItem('anxin_default_role', 'family');
      btn.textContent = '已开启';
      btn.style.background = 'var(--accent)';
      btn.style.color = 'white';
      btn.style.borderColor = 'var(--accent)';
    }
  },

  // ========== 摔倒检测 ==========
  toggleFallDetection(btn) {
    const current = State.get('fallDetectionEnabled');
    const next = current === false ? true : false;
    State.set('fallDetectionEnabled', next);
    if (next) {
      btn.textContent = '已开启';
      btn.style.background = 'var(--accent)';
      btn.style.color = 'white';
      btn.style.borderColor = 'var(--accent)';
      Elder.startFallDetection();
    } else {
      btn.textContent = '已关闭';
      btn.style.background = 'var(--bg)';
      btn.style.color = 'var(--ink)';
      btn.style.borderColor = 'var(--rule)';
      Elder.stopFallDetection();
    }
  },

  startFallDetection() {
    if (!window.DeviceMotionEvent) {
      console.warn('设备不支持运动检测');
      return;
    }
    this._fallHandler = (e) => {
      if (State.get('fallDetectionEnabled') === false) return;
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
      // 检测突然的大加速度变化（摔倒特征）
      if (magnitude > 25) {
        this.triggerFallSOS();
      }
    };
    window.addEventListener('devicemotion', this._fallHandler);
  },

  stopFallDetection() {
    if (this._fallHandler) {
      window.removeEventListener('devicemotion', this._fallHandler);
      this._fallHandler = null;
    }
  },

  testFallDetection() {
    this.triggerFallSOS();
  },

  triggerFallSOS() {
    // 防止重复触发
    const lastFall = State.get('fallDetectedAt');
    if (lastFall && Date.now() - lastFall < 60000) return;

    State.set('fallDetectedAt', Date.now());
    State.emit('mascot', { state: 'thinking', duration: 10000 });

    let countdown = 10;
    const modal = document.getElementById('modal-layer');
    modal.classList.add('active');

    const updateModal = () => {
      modal.innerHTML = `
        <div class="modal-box emergency-box" style="border: 4px solid var(--danger); animation: emergencyPulse 1.2s infinite;">
          <div style="font-size: 64px; margin-bottom: 10px;">⚠️</div>
          <h3 style="color: var(--danger);">检测到可能摔倒</h3>
          <p style="font-size: 20px;">将在 <strong style="font-size: 32px; color: var(--danger);">${countdown}</strong> 秒后自动联系紧急联系人</p>
          <p style="font-size: 15px; color: var(--muted);">如果没事，请点击"我没事"取消</p>
          <div class="modal-actions" style="flex-direction: column; margin-top: 16px;">
            <button class="btn-primary full" style="background: var(--accent2);" onclick="Elder.cancelFallSOS()">我没事，取消求助</button>
          </div>
        </div>
      `;
    };

    updateModal();
    this.speak('检测到可能摔倒，即将自动求助，如果没事请按我没事取消。');

    this._fallTimer = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(this._fallTimer);
        this.executeFallSOS();
      } else {
        updateModal();
      }
    }, 1000);
  },

  cancelFallSOS() {
    if (this._fallTimer) {
      clearInterval(this._fallTimer);
      this._fallTimer = null;
    }
    this.closeModal();
    this.speak('已取消求助。');
    State.emit('mascot', { state: 'happy', duration: 1500 });
  },

  executeFallSOS() {
    this.closeModal();
    // 触发紧急呼叫
    this.callEmergency('son');
    // 通知子女端
    State.set('fallDetectedAt', Date.now());
    this.speak('已通知紧急联系人。');
  },

  speak(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  },

  // ========== 反诈提醒弹窗 ==========
  showFraudAlert(alert) {
    const modal = document.getElementById('modal-layer');
    modal.classList.add('active');
    modal.innerHTML = `
      <div class="modal-box" style="text-align: left; max-width: 520px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--warning); display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">⚠️</div>
          <h3 style="margin: 0; color: var(--warning);">${alert.title}</h3>
        </div>
        <p style="font-size: 17px; line-height: 1.7; color: var(--ink); margin-bottom: 16px;">${alert.content}</p>
        <div style="background: #fff8f0; border-left: 4px solid var(--accent); padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px; color: var(--muted);">来源：${alert.source || '安心小屏'} · ${alert.date}</p>
        </div>
        <div style="text-align: center;">
          <button class="btn-primary full" style="font-size: 18px; padding: 16px;" onclick="Elder.confirmFraudAlert('${alert.id}')">我知道了</button>
        </div>
      </div>
    `;
    this.speak('反诈提醒：' + alert.title + '。' + alert.content);
  },

  confirmFraudAlert(id) {
    State.markFraudRead(id);
    this.closeModal();
    this.speak('已记录，请保持警惕。');
    State.emit('mascot', { state: 'happy', duration: 1500 });
  },

  // ========== 语音留言 ==========
  async startVoiceRecord() {
    const status = document.getElementById('voice-record-status');
    if (status) status.style.display = 'block';

    // 使用 Web Speech API 作为语音输入替代方案（无需服务器）
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      if (status) status.textContent = '设备不支持语音输入';
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this._recognition = new SpeechRecognition();
    this._recognition.lang = 'zh-CN';
    this._recognition.continuous = false;
    this._recognition.interimResults = false;

    this._recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this._lastTranscript = transcript;
    };

    this._recognition.onerror = () => {
      if (status) {
        status.textContent = '语音识别出错，请重试';
        setTimeout(() => { status.style.display = 'none'; status.textContent = '正在录音...'; }, 1500);
      }
    };

    this._recognition.start();
  },

  stopVoiceRecord() {
    const status = document.getElementById('voice-record-status');
    if (this._recognition) {
      this._recognition.stop();
    }
    if (status) {
      status.textContent = '正在发送...';
      setTimeout(() => { status.style.display = 'none'; status.textContent = '正在录音...'; }, 500);
    }

    // 发送语音转文字留言
    setTimeout(() => {
      if (this._lastTranscript) {
        State.addVoiceMessage({
          from: 'elder',
          text: this._lastTranscript,
          duration: Math.max(3, Math.round(this._lastTranscript.length / 5))
        });
        this.speak('留言已发送给子女');
        this._lastTranscript = '';
        // 刷新子女端列表
        if (typeof Family.renderVoiceMessages === 'function') {
          Family.renderVoiceMessages();
        }
      }
    }, 600);
  },

  // ========== 角色形象（Mascot） ==========

  mascotState: 'idle',
  mascotTimer: null,

  // SVG 表情定义（后期替换为真实图片时只需改这里）
  mascotFaces: {
    idle: `<svg viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="24" fill="#fef0e4" stroke="#c86f32" stroke-width="1.5"/><circle cx="20" cy="22" r="2.5" fill="#c86f32"/><circle cx="36" cy="22" r="2.5" fill="#c86f32"/><path d="M20 34c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#c86f32" stroke-width="2" stroke-linecap="round"/></svg>`,
    talking: `<svg viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="24" fill="#fef0e4" stroke="#c86f32" stroke-width="1.5"/><circle cx="20" cy="22" r="2.5" fill="#c86f32"/><circle cx="36" cy="22" r="2.5" fill="#c86f32"/><ellipse cx="28" cy="35" rx="5" ry="4" fill="#c86f32" opacity="0.7"/></svg>`,
    listening: `<svg viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="24" fill="#fef0e4" stroke="#c86f32" stroke-width="1.5"/><path d="M18 22 Q20 20 22 22" stroke="#c86f32" stroke-width="2.5" stroke-linecap="round"/><path d="M34 22 Q36 20 38 22" stroke="#c86f32" stroke-width="2.5" stroke-linecap="round"/><path d="M20 34c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#c86f32" stroke-width="2" stroke-linecap="round"/></svg>`,
    thinking: `<svg viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="24" fill="#fef0e4" stroke="#c86f32" stroke-width="1.5"/><circle cx="20" cy="22" r="2.5" fill="#c86f32"/><circle cx="36" cy="22" r="2.5" fill="#c86f32"/><path d="M22 34c2-4 4-6 6-6s4 2 6 6" stroke="#c86f32" stroke-width="2" stroke-linecap="round"/><circle cx="40" cy="16" r="1.5" fill="#c86f32" opacity="0.5"/><circle cx="44" cy="14" r="1" fill="#c86f32" opacity="0.3"/></svg>`,
    happy: `<svg viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="24" fill="#fef0e4" stroke="#c86f32" stroke-width="1.5"/><path d="M17 20 Q20 17 23 20" stroke="#c86f32" stroke-width="2.5" stroke-linecap="round"/><path d="M33 20 Q36 17 39 20" stroke="#c86f32" stroke-width="2.5" stroke-linecap="round"/><path d="M18 32c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="#c86f32" stroke-width="2" stroke-linecap="round"/></svg>`
  },

  // 初始化形象
  initMascot() {
    this.updateMascot('idle');

    // 监听状态变化
    State.on('mascot', (data) => {
      if (data && data.state) {
        this.updateMascot(data.state, data.duration);
      }
    });
  },

  // 更新表情
  updateMascot(state, duration) {
    this.mascotState = state;
    const face = document.getElementById('mascot-face');
    const label = document.getElementById('mascot-label');
    if (!face) return;

    // 清除之前的定时恢复
    if (this.mascotTimer) {
      clearTimeout(this.mascotTimer);
      this.mascotTimer = null;
    }

    // 更新 SVG
    face.innerHTML = this.mascotFaces[state] || this.mascotFaces.idle;

    // 更新动画 class
    face.className = 'mascot-face';
    if (state !== 'idle') {
      face.classList.add(state);
    }

    // 更新标签
    const labels = {
      idle: '点我说句话',
      talking: '正在说话...',
      listening: '正在播放...',
      thinking: '让我想想...',
      happy: '太棒了！'
    };
    if (label) label.textContent = labels[state] || '';

    // 自动恢复到 idle
    if (duration && state !== 'idle') {
      this.mascotTimer = setTimeout(() => {
        this.updateMascot('idle');
      }, duration);
    }
  },

  // 点击形象
  tapMascot() {
    // 打开问助手弹窗
    this.openModal('assistant');
  }
};
