/**
 * 安心小屏 - 老人端交互
 * 处理大按钮点击，打开全屏功能弹窗
 */

const Elder = {
  currentView: null,

  init() {
    this.setupActionButtons();
    this.setupPanelBack();
    return this;
  },

  // 设置大按钮点击事件
  setupActionButtons() {
    const buttons = document.querySelectorAll('.elder-action');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.openPanel(view);
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

  // 获取弹窗内容容器
  getPanelBody() {
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
  }
};
