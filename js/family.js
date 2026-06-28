/**
 * 安心小屏 - 子女端交互
 * 处理子女端的提醒创建、状态查看、视频通话发起
 */

const Family = {
  init() {
    this.setupForm();
    this.setupQuickButton();
    return this;
  },

  // 设置表单提交
  setupForm() {
    const form = document.getElementById('reminder-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.createReminder();
    });
  },

  // 设置快捷按钮
  setupQuickButton() {
    const btn = document.getElementById('btn-quick');
    if (!btn) return;

    btn.addEventListener('click', () => {
      document.getElementById('input-title').value = '吃降压药';
      document.getElementById('input-type').value = '吃药';
      document.getElementById('input-time').value = '20:00';
      document.getElementById('input-note').value = '请按医嘱服用，吃过后点"我吃过了"。';
    });
  },

  // 创建提醒
  createReminder() {
    const title = document.getElementById('input-title').value.trim();
    const type = document.getElementById('input-type').value;
    const time = document.getElementById('input-time').value;
    const note = document.getElementById('input-note').value.trim();

    if (!title || !time) {
      alert('请填写提醒内容和时间');
      return;
    }

    State.addReminder({
      title,
      type,
      time,
      note
    });

    // 重置表单
    document.getElementById('reminder-form').reset();

    // 显示成功提示
    this.showToast('提醒已添加，已同步到老人端');

    // 刷新列表
    Reminders.renderFamilyList();
    Reminders.updateNextReminder();
  },

  // 显示提示
  showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--accent2);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 400;
      animation: fadeInUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
};
