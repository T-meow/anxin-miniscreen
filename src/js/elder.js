/**
 * 安心小屏 - 老人端交互
 * 处理老人端的大按钮点击、抽屉内容切换
 */

const Elder = {
  init() {
    this.setupActionButtons();
    return this;
  },

  // 设置大按钮点击事件
  setupActionButtons() {
    const buttons = document.querySelectorAll('.elder-action');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.handleAction(view);
      });
    });
  },

  // 处理按钮动作
  handleAction(view) {
    const drawer = document.getElementById('elder-drawer');

    switch (view) {
      case 'assistant':
        Assistant.show();
        break;
      case 'entertainment':
        Entertainment.show();
        break;
      case 'reminders':
        Reminders.showDrawer();
        break;
      case 'family':
        this.showFamilyInfo();
        break;
      case 'emergency':
        this.showEmergency();
        break;
      case 'settings':
        this.showSettings();
        break;
      default:
        drawer.innerHTML = `
          <div class="drawer-empty">
            <strong>功能开发中</strong>
            <p>这个功能还在开发，请稍后再试。</p>
          </div>
        `;
    }
  },

  // 显示家人信息
  showFamilyInfo() {
    const drawer = document.getElementById('elder-drawer');
    drawer.dataset.view = 'family';
    drawer.innerHTML = `
      <h3 style="margin-bottom: 16px;">家人信息</h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="padding: 16px; background: var(--bg); border-radius: 12px; display: flex; align-items: center; gap: 16px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 28px;">👨</div>
          <div>
            <strong style="font-size: 18px;">儿子</strong>
            <p style="margin: 4px 0 0; color: var(--muted);">138****8888</p>
          </div>
          <button class="btn-primary" style="margin-left: auto;" onclick="WebRTC.initiateCall()">视频通话</button>
        </div>
        <div style="padding: 16px; background: var(--bg); border-radius: 12px; display: flex; align-items: center; gap: 16px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--accent2); display: flex; align-items: center; justify-content: center; font-size: 28px;">👩</div>
          <div>
            <strong style="font-size: 18px;">女儿</strong>
            <p style="margin: 4px 0 0; color: var(--muted);">139****6666</p>
          </div>
          <button class="btn-primary" style="margin-left: auto;" onclick="WebRTC.initiateCall()">视频通话</button>
        </div>
      </div>
    `;
  },

  // 紧急联系
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

  // 关闭弹窗
  closeModal() {
    const modal = document.getElementById('modal-layer');
    modal.innerHTML = '';
    modal.classList.remove('active');
  },

  // 简单设置
  showSettings() {
    const drawer = document.getElementById('elder-drawer');
    drawer.dataset.view = 'settings';
    drawer.innerHTML = `
      <h3 style="margin-bottom: 16px;">简单设置</h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="padding: 16px; background: var(--bg); border-radius: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong>语音播报</strong>
            <button class="btn-secondary" onclick="this.textContent=this.textContent==='开'?'关':'开'">开</button>
          </div>
          <p style="margin: 4px 0 0; color: var(--muted); font-size: 14px;">提醒和回复时自动朗读</p>
        </div>
        <div style="padding: 16px; background: var(--bg); border-radius: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong>字体大小</strong>
            <div>
              <button class="btn-secondary">小</button>
              <button class="btn-secondary" style="background: var(--accent); color: white;">大</button>
              <button class="btn-secondary">特大</button>
            </div>
          </div>
        </div>
        <div style="padding: 16px; background: var(--bg); border-radius: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong>屏幕常亮</strong>
            <button class="btn-secondary" onclick="this.textContent=this.textContent==='开'?'关':'开'">开</button>
          </div>
          <p style="margin: 4px 0 0; color: var(--muted); font-size: 14px;">保持屏幕一直亮着</p>
        </div>
        <button class="btn-secondary" style="margin-top: 8px;" onclick="State.resetDemo(); alert('演示数据已重置'); location.reload();">重置演示数据</button>
      </div>
    `;
  }
};
