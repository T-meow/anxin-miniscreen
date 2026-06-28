/**
 * 安心小屏 - 提醒系统
 * 管理提醒的创建、触发、确认和超时逻辑（支持周期性提醒打卡）
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
      // 只有今天该触发的提醒才检查时间
      if (!State.isReminderDueToday(r)) return;

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

    const cycleLabel = State.getNextReminderDate(reminder);
    const cycleBadge = reminder.cycle && reminder.cycle !== 'daily' ? ` <span style="font-size: 14px; color: var(--accent);">(${cycleLabel})</span>` : '';

    const modal = document.getElementById('modal-layer');
    modal.classList.add('active');
    modal.innerHTML = `
      <div class="reminder-popup active">
        <div class="popup-box">
          <div class="popup-icon">${reminder.type === '打针' ? '💉' : '⏰'}</div>
          <h3>${reminder.title}${cycleBadge}</h3>
          <p>${reminder.note || '到时间了，请完成这项任务。'}</p>
          <div class="popup-actions">
            <button class="btn-primary" onclick="Reminders.confirm('${reminder.id}')">${reminder.type === '打针' ? '已注射 / 已完成' : '我吃过了 / 已完成'}</button>
            <button class="btn-secondary" onclick="Reminders.snooze('${reminder.id}')">稍后提醒（10分钟）</button>
          </div>
        </div>
      </div>
    `;

    this.speak(`提醒：${reminder.title}。${reminder.note || ''}`);
  },

  // 确认完成（打卡）
  confirm(id) {
    const reminder = State.getReminders().find(r => r.id === id);
    if (!reminder) return;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    const history = [...(reminder.confirmHistory || []), { date: todayStr, time: timeStr }];

    // 周期性提醒：重置 triggered，保留 pending 状态以便下次触发
    if (reminder.cycle && reminder.cycle !== 'daily') {
      State.updateReminder(id, {
        triggered: false,
        confirmHistory: history,
        status: 'pending',
        missedCount: 0
      });
    } else {
      // 一次性提醒或每日提醒：标记为 done
      State.updateReminder(id, {
        status: 'done',
        confirmedAt: Date.now(),
        confirmHistory: history,
        triggered: false
      });
    }

    this.closePopup();
    this.renderFamilyList();
    this.updateNextReminder();
    this.speak('好的，已记录。');
    State.emit('mascot', { state: 'happy', duration: 1500 });
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
    const cycleLabel = State.getNextReminderDate(next);
    el.textContent = `${next.time} ${next.title} ${cycleLabel ? '(' + cycleLabel + ')' : ''}`;
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
    if (hintEl) hintEl.textContent = reminders.length > 0 ? '已创建提醒' : '还没有创建提醒';

    if (reminders.length === 0) {
      container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 20px;">暂无提醒</p>';
      return;
    }

    container.innerHTML = reminders.map(r => {
      const isDueToday = State.isReminderDueToday(r);
      const isOverdue = State.getOverdueReminders().some(o => o.id === r.id);

      // 状态判断
      let statusClass = '';
      let statusText = '';
      let statusBadge = '';

      if (!isDueToday && r.cycle && r.cycle !== 'daily') {
        // 周期性提醒，今天不该触发
        statusClass = '';
        statusText = State.getNextReminderDate(r);
        statusBadge = 'status-pending';
      } else if (r.status === 'done' && (!r.cycle || r.cycle === 'daily')) {
        statusClass = 'done';
        statusText = '已确认';
        statusBadge = 'status-done';
      } else if (isOverdue) {
        statusClass = 'overdue';
        statusText = '已逾期';
        statusBadge = 'status-overdue';
      } else {
        statusClass = '';
        statusText = '待完成';
        statusBadge = 'status-pending';
      }

      // 打卡记录
      const lastConfirm = r.confirmHistory && r.confirmHistory.length > 0
        ? r.confirmHistory[r.confirmHistory.length - 1]
        : null;
      const historyHint = lastConfirm
        ? `<span style="color: var(--accent2); font-size: 12px;">上次打卡：${lastConfirm.date} ${lastConfirm.time}</span>`
        : '<span style="color: var(--muted); font-size: 12px;">尚未打卡</span>';

      const cycleTag = r.cycle && r.cycle !== 'daily'
        ? `<span style="margin-left: 6px; padding: 1px 6px; background: #e4f0f6; color: var(--brand); border-radius: 4px; font-size: 11px;">${State.getNextReminderDate(r)}</span>`
        : '';

      return `
        <div class="reminder-item ${statusClass}">
          <div class="reminder-info">
            <strong>${r.time} ${r.title}${cycleTag}</strong>
            <span>${r.type} · ${r.note || '无说明'}</span>
            ${historyHint}
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
        <p style="color: var(--muted); text-align: center; padding: 40px; font-size: 18px;">暂无提醒</p>
      `;
      return;
    }

    // 分离今日该触发和不需要触发的
    const dueToday = reminders.filter(r => State.isReminderDueToday(r));
    const notDue = reminders.filter(r => !State.isReminderDueToday(r));
    const doneToday = reminders.filter(r => {
      const todayStr = new Date().toISOString().split('T')[0];
      return (r.confirmHistory || []).some(h => h.date === todayStr);
    });

    body.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${dueToday.length > 0 ? `
          <div>
            <h4 style="color: var(--accent); margin-bottom: 10px; font-size: 17px;">
              <svg viewBox="0 0 16 16" width="14" height="14" style="vertical-align: middle; margin-right: 4px;"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>
              今天待完成 (${dueToday.length})
            </h4>
            ${dueToday.map(r => `
              <div style="padding: 16px; background: var(--bg2); border-radius: 14px; margin-bottom: 10px; border-left: 5px solid var(--accent);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <strong style="font-size: 20px;">${r.time} ${r.title}</strong>
                    ${r.cycle && r.cycle !== 'daily' ? `<span style="margin-left: 6px; padding: 2px 8px; background: #e4f0f6; color: var(--brand); border-radius: 4px; font-size: 12px;">${State.getNextReminderDate(r)}</span>` : ''}
                  </div>
                  <button class="btn-primary" style="padding: 8px 16px; font-size: 14px; white-space: nowrap;" onclick="Reminders.confirm('${r.id}')">
                    <svg viewBox="0 0 16 16" width="14" height="14" style="vertical-align: middle; margin-right: 2px;"><path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    打卡
                  </button>
                </div>
                <p style="margin: 6px 0 0; color: var(--muted); font-size: 15px;">${r.note || ''}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${doneToday.length > 0 ? `
          <div>
            <h4 style="color: var(--accent2); margin-bottom: 10px; font-size: 17px;">
              <svg viewBox="0 0 16 16" width="14" height="14" style="vertical-align: middle; margin-right: 4px;"><path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              今日已打卡 (${doneToday.length})
            </h4>
            ${doneToday.map(r => `
              <div style="padding: 14px; background: var(--bg2); border-radius: 14px; margin-bottom: 10px; opacity: 0.65; border-left: 5px solid var(--accent2);">
                <strong>${r.time} ${r.title}</strong>
                <span style="color: var(--accent2); margin-left: 8px; font-size: 15px;">已完成</span>
                ${r.cycle && r.cycle !== 'daily' ? `<p style="margin: 4px 0 0; font-size: 13px; color: var(--muted);">下次：${State.getNextReminderDate(r)}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${notDue.length > 0 ? `
          <div>
            <h4 style="color: var(--muted); margin-bottom: 10px; font-size: 17px;">其他提醒 (${notDue.length})</h4>
            ${notDue.map(r => `
              <div style="padding: 14px; background: var(--bg2); border-radius: 14px; margin-bottom: 10px; opacity: 0.6;">
                <strong>${r.time} ${r.title}</strong>
                <span style="margin-left: 8px; padding: 2px 8px; background: #e4f0f6; color: var(--brand); border-radius: 4px; font-size: 12px;">${State.getNextReminderDate(r)}</span>
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
