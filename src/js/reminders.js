/**
 * 安心小屏 - 提醒系统
 * 管理提醒的创建、触发、确认和超时逻辑
 */

const Reminders = {
  init() {
    this.checkInterval = setInterval(() => this.check(), 30000); // 每30秒检查一次
    this.renderFamilyList();
    this.renderElderDrawer();
    this.updateNextReminder();

    // 监听状态同步
    State.on('sync', () => {
      this.renderFamilyList();
      this.renderElderDrawer();
      this.updateNextReminder();
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
    // 避免重复触发
    if (reminder.triggered) return;
    State.updateReminder(reminder.id, { triggered: true });
    
    // 确保在老人端显示
    const elderScreen = document.getElementById('elder-screen');
    if (!elderScreen.classList.contains('active')) {
      // 切换到老人端
      const elderBtn = document.querySelector('[data-mode="elder"]');
      if (elderBtn) elderBtn.click();
    }

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

    // 语音播报（如果支持）
    this.speak(`提醒：${reminder.title}。${reminder.note || ''}`);
  },

  // 确认完成
  confirm(id) {
    State.updateReminder(id, { status: 'done', confirmedAt: Date.now() });
    this.closePopup();
    this.renderFamilyList();
    this.renderElderDrawer();
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

  // 更新老人端下一项提醒显示
  updateNextReminder() {
    const pending = State.getPendingReminders();
    const titleEl = document.getElementById('next-reminder-title');
    const metaEl = document.getElementById('next-reminder-meta');

    if (pending.length === 0) {
      titleEl.textContent = '暂无提醒';
      metaEl.textContent = '子女端可以远程添加提醒。';
      return;
    }

    // 按时间排序
    pending.sort((a, b) => {
      const [ha, ma] = a.time.split(':').map(Number);
      const [hb, mb] = b.time.split(':').map(Number);
      return (ha * 60 + ma) - (hb * 60 + mb);
    });

    const next = pending[0];
    titleEl.textContent = `${next.time} ${next.title}`;
    metaEl.textContent = next.note || '请按时完成';
  },

  // 更新子女端异常提醒面板
  updateAlertPanel() {
    const overdue = State.getOverdueReminders();
    const countEl = document.getElementById('alert-count');
    const hintEl = document.getElementById('alert-hint');
    const panel = document.getElementById('alert-panel');

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

    countEl.textContent = `${reminders.length} 项`;
    hintEl.textContent = reminders.length > 0 ? '今日已创建提醒' : '还没有创建提醒';

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

  // 渲染老人端提醒抽屉
  renderElderDrawer() {
    const drawer = document.getElementById('elder-drawer');
    if (!drawer || drawer.dataset.view !== 'reminders') return;

    const reminders = State.getReminders();
    if (reminders.length === 0) {
      drawer.innerHTML = `
        <div class="drawer-empty">
          <strong>今日暂无提醒</strong>
          <p>子女端可以远程添加提醒。</p>
        </div>
      `;
      return;
    }

    const pending = reminders.filter(r => r.status === 'pending');
    const done = reminders.filter(r => r.status === 'done');

    drawer.innerHTML = `
      <h3 style="margin-bottom: 16px;">今日提醒</h3>
      ${pending.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--accent); margin-bottom: 8px;">待完成</h4>
          ${pending.map(r => `
            <div style="padding: 12px; background: var(--bg); border-radius: 8px; margin-bottom: 8px; border-left: 4px solid var(--accent);">
              <strong style="font-size: 20px;">${r.time} ${r.title}</strong>
              <p style="margin: 4px 0 0; color: var(--muted);">${r.note || ''}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${done.length > 0 ? `
        <div>
          <h4 style="color: var(--accent2); margin-bottom: 8px;">已完成</h4>
          ${done.map(r => `
            <div style="padding: 12px; background: var(--bg); border-radius: 8px; margin-bottom: 8px; opacity: 0.7; border-left: 4px solid var(--accent2);">
              <strong>${r.time} ${r.title}</strong>
              <span style="color: var(--accent2); margin-left: 8px;">✓ 已完成</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  },

  // 显示提醒抽屉
  showDrawer() {
    const drawer = document.getElementById('elder-drawer');
    drawer.dataset.view = 'reminders';
    this.renderElderDrawer();
  }
};
