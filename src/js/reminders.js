/**
 * 安心小屏 - 提醒系统
 * 管理提醒的创建、触发、确认和超时逻辑
 */

const Reminders = {
  init() {
    this.checkInterval = setInterval(() => this.check(), 30000); // 每30秒检查一次
    this.renderFamilyList();
    this.updateNextReminder();

    // 监听状态同步
    State.on('sync', () => {
      this.renderFamilyList();
      this.updateNextReminder();
      // 如果提醒弹窗正打开，也刷新
      if (Elder.currentView === 'reminders') {
        this.renderPanel();
      }
    });

    return this;
  },

  // 检查是否有到时间的提醒
  check() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const reminders = State.getReminders();

    reminders.forEach(r => {
      if (r.status !== 'pending') return;
      const [h, m] = r.time.split(':').map(Number);
      const reminderTime = h * 60 + m;

      // 提醒时间到了（允许1分钟误差）
      if (Math.abs(currentTime - reminderTime) <= 1 && !r.triggered) {
        this.trigger(r);
      }
    });

    this.updateAlertPanel();
  },

  // 触发提醒弹窗
  trigger(reminder) {
    if (reminder.triggered) return;
    State.updateReminder(reminder.id, { triggered: true });
    
    // 如果在子女端，切回老人端
    if (App.currentMode !== 'elder') {
      App.switchToElder();
    }

    // 关闭功能弹窗（如果有）
    Elder.closePanel();

    const modal = document.getElementById('modal-layer');
    modal.classList.add('active');
    modal.innerHTML = `
      <div class="reminder-popup active">
        <div class="popup-box">
          <div class="popup-icon">⏰</div>
          <h3>${reminder.title}</h3>
          <p>${reminder.note || '到时间了，请完成这项任务。'}</p>
          <div class="popup-actions">
            <button class="btn-primary" onclick="Reminders.confirm('${reminder.id}')">我吃过了 / 已完成</button>
            <button class="btn-secondary" onclick="Reminders.snooze('${reminder.id}')">稍后提醒（10分钟）</button>
          </div>
        </div>
      </div>
    `;

    this.speak(`提醒：${reminder.title}。${reminder.note || ''}`);
  },

  // 确认完成
  confirm(id) {
    State.updateReminder(id, { status: 'done', confirmedAt: Date.now() });
    this.closePopup();
    this.renderFamilyList();
    this.updateNextReminder();
    this.speak('好的，已记录。');
  },

  // 稍后提醒
  snooze(id) {
    State.updateReminder(id, { triggered: false });
    this.closePopup();
    setTimeout(() => {
      const r = State.getReminders().find(r => r.id === id);
      if (r) this.trigger(r);
    }, 600000); // 10分钟后再次提醒
  },

  // 关闭弹窗
  closePopup() {
    const modal = document.getElementById('modal-layer');
    modal.innerHTML = '';
    modal.classList.remove('active');
  },

  // 语音播报
  speak(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  },

  // 更新老人端首页提醒信息条
  updateNextReminder() {
    const pending = State.getPendingReminders();
    const el = document.getElementById('next-reminder-inline');

    if (!el) return;

    if (pending.length === 0) {
      el.textContent = '暂无提醒';
      return;
    }

    pending.sort((a, b) => {
      const [ha, ma] = a.time.split(':').map(Number);
      const [hb, mb] = b.time.split(':').map(Number);
      return (ha * 60 + ma) - (hb * 60 + mb);
    });

    const next = pending[0];
    el.textContent = `${next.time} ${next.title}`;
  },

  // 更新子女端异常提醒面板
  updateAlertPanel() {
    const overdue = State.getOverdueReminders();
    const countEl = document.getElementById('alert-count');
    const hintEl = document.getElementById('alert-hint');
    const panel = document.getElementById('alert-panel');

    if (!countEl || !hintEl || !panel) return;

    if (overdue.length > 0) {
      countEl.textContent = `${overdue.length} 项`;
      hintEl.textContent = '有提醒未按时确认';
      panel.style.borderColor = 'var(--danger)';
    } else {
      countEl.textContent = '0 项';
      hintEl.textContent = '暂无异常';
      panel.style.borderColor = 'var(--warning)';
    }
  },

  // 渲染子女端提醒列表
  renderFamilyList() {
    const container = document.getElementById('family-reminder-list');
    if (!container) return;

    const reminders = State.getReminders();
    const countEl = document.getElementById('reminder-count');
    const hintEl = document.getElementById('reminder-hint');

    if (countEl) countEl.textContent = `${reminders.length} 项`;
    if (hintEl) hintEl.textContent = reminders.length > 0 ? '今日已创建提醒' : '还没有创建提醒';

    if (reminders.length === 0) {
      container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 20px;">暂无提醒</p>';
      return;
    }

    container.innerHTML = reminders.map(r => {
      const statusClass = r.status === 'done' ? 'done' : 
                         State.getOverdueReminders().some(o => o.id === r.id) ? 'overdue' : '';
      const statusText = r.status === 'done' ? '已确认' : 
                        statusClass === 'overdue' ? '未确认' : '待完成';
      const statusBadge = r.status === 'done' ? 'status-done' : 
                         statusClass === 'overdue' ? 'status-overdue' : 'status-pending';

      return `
        <div class="reminder-item ${statusClass}">
          <div class="reminder-info">
            <strong>${r.time} ${r.title}</strong>
            <span>${r.type} · ${r.note || '无说明'}</span>
          </div>
          <span class="reminder-status ${statusBadge}">${statusText}</span>
        </div>
      `;
    }).join('');
  },

  // 渲染老人端提醒列表（在全屏弹窗内）
  renderPanel() {
    const body = Elder.getPanelBody();
    if (!body) return;

    const reminders = State.getReminders();
    if (reminders.length === 0) {
      body.innerHTML = `
        <p style="color: var(--muted); text-align: center; padding: 40px; font-size: 18px;">今日暂无提醒</p>
      `;
      return;
    }

    const pending = reminders.filter(r => r.status === 'pending');
    const done = reminders.filter(r => r.status === 'done');

    body.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${pending.length > 0 ? `
          <div>
            <h4 style="color: var(--accent); margin-bottom: 10px; font-size: 17px;">待完成 (${pending.length})</h4>
            ${pending.map(r => `
              <div style="padding: 16px; background: var(--bg2); border-radius: 14px; margin-bottom: 10px; border-left: 5px solid var(--accent);">
                <strong style="font-size: 20px;">${r.time} ${r.title}</strong>
                <p style="margin: 6px 0 0; color: var(--muted); font-size: 15px;">${r.note || ''}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${done.length > 0 ? `
          <div>
            <h4 style="color: var(--accent2); margin-bottom: 10px; font-size: 17px;">已完成 (${done.length})</h4>
            ${done.map(r => `
              <div style="padding: 14px; background: var(--bg2); border-radius: 14px; margin-bottom: 10px; opacity: 0.65; border-left: 5px solid var(--accent2);">
                <strong>${r.time} ${r.title}</strong>
                <span style="color: var(--accent2); margin-left: 8px; font-size: 15px;">已完成</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },

  // 显示提醒面板（从 elder.js 调用）
  showPanel() {
    this.renderPanel();
  }
};
