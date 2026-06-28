/**
 * 安心小屏 - 子女端交互
 * 处理子女端的提醒创建、状态查看、视频通话发起
 */

const Family = {
  currentCycle: 'daily',

  init() {
    this.setupForm();
    this.setupQuickButton();
    this.renderFraudCard();
    this.renderFallCard();
    this.renderMedicationReport();
    this.renderVoiceMessages();

    // 监听同步事件刷新界面
    State.on('sync', () => {
      this.renderFraudCard();
      this.renderFallCard();
      this.renderMedicationReport();
      this.renderVoiceMessages();
    });

    return this;
  },

  // 设置周期类型
  setCycle(cycle) {
    this.currentCycle = cycle;

    // 更新按钮样式
    document.querySelectorAll('.cycle-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cycle === cycle);
    });

    // 更新详细选项
    const detail = document.getElementById('cycle-detail');
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    if (cycle === 'daily') {
      detail.innerHTML = '<p class="cycle-hint">每天同一时间提醒老人</p>';
    } else if (cycle === 'weekly') {
      detail.innerHTML = `
        <label style="margin-bottom: 0; font-size: 13px;">每周几提醒？</label>
        <select id="cycle-weekday" class="cycle-select">
          ${weekDays.map((d, i) => `<option value="${i}">${d}</option>`).join('')}
        </select>
      `;
    } else if (cycle === 'monthly') {
      detail.innerHTML = `
        <label style="margin-bottom: 0; font-size: 13px;">每月几号提醒？</label>
        <select id="cycle-monthday" class="cycle-select">
          ${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1}号</option>`).join('')}
        </select>
      `;
    } else if (cycle === 'custom') {
      detail.innerHTML = `
        <label style="margin-bottom: 0; font-size: 13px;">每多少天提醒一次？</label>
        <select id="cycle-everyn" class="cycle-select">
          <option value="2">每2天</option>
          <option value="3">每3天</option>
          <option value="7">每7天（每周）</option>
          <option value="14">每14天</option>
          <option value="30">每30天（每月）</option>
          <option value="90">每90天（每季度）</option>
          <option value="180">每180天（每半年）</option>
        </select>
      `;
    }
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
      this.fillQuickReminder('吃降压药', '吃药', '20:00', '请按医嘱服用，吃过后点"我吃过了"。');
    });
  },

  // 填充快捷提醒
  fillQuickReminder(title, type, time, note, cycle, cycleDetail) {
    document.getElementById('input-title').value = title;
    document.getElementById('input-type').value = type;
    document.getElementById('input-time').value = time;
    document.getElementById('input-note').value = note;
    if (cycle) {
      this.setCycle(cycle);
      if (cycleDetail !== undefined) {
        setTimeout(() => {
          if (cycle === 'weekly' && document.getElementById('cycle-weekday')) {
            document.getElementById('cycle-weekday').value = cycleDetail;
          } else if (cycle === 'monthly' && document.getElementById('cycle-monthday')) {
            document.getElementById('cycle-monthday').value = cycleDetail;
          } else if (cycle === 'custom' && document.getElementById('cycle-everyn')) {
            document.getElementById('cycle-everyn').value = cycleDetail;
          }
        }, 10);
      }
    }
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

    const reminder = {
      title,
      type,
      time,
      note,
      cycle: this.currentCycle
    };

    // 根据周期类型添加额外字段
    if (this.currentCycle === 'weekly') {
      const weekDayEl = document.getElementById('cycle-weekday');
      if (weekDayEl) reminder.weekDay = parseInt(weekDayEl.value);
    } else if (this.currentCycle === 'monthly') {
      const monthDayEl = document.getElementById('cycle-monthday');
      if (monthDayEl) reminder.monthDay = parseInt(monthDayEl.value);
    } else if (this.currentCycle === 'custom') {
      const everyNEl = document.getElementById('cycle-everyn');
      if (everyNEl) reminder.everyNDays = parseInt(everyNEl.value);
    }

    State.addReminder(reminder);

    // 重置表单
    document.getElementById('reminder-form').reset();
    this.setCycle('daily');

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
  },

  // ========== 反诈提醒 ==========
  renderFraudCard() {
    const alerts = State.getFraudAlerts();
    const unread = alerts.filter(a => !a.read).length;
    const countEl = document.getElementById('fraud-count');
    const hintEl = document.getElementById('fraud-hint');
    const card = document.getElementById('fraud-card');

    if (!countEl || !hintEl) return;

    countEl.textContent = `${alerts.length} 条`;
    if (unread > 0) {
      hintEl.textContent = `${unread} 条未读提醒`;
      card.style.borderColor = 'var(--warning)';
    } else {
      hintEl.textContent = '老人已了解最新提醒';
      card.style.borderColor = 'var(--rule)';
    }
  },

  showFraudPanel() {
    const alerts = State.getFraudAlerts();
    const body = Elder.getPanelBody();
    const panel = document.getElementById('fullscreen-panel');
    const title = document.getElementById('panel-title');

    title.textContent = '反诈提醒记录';
    Elder.currentView = 'fraud';

    if (alerts.length === 0) {
      body.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 40px;">暂无反诈提醒</p>';
    } else {
      body.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${alerts.map(a => `
            <div style="padding: 16px; background: var(--bg2); border-radius: 14px; border-left: 5px solid ${a.read ? 'var(--accent2)' : 'var(--warning)'};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                <strong style="font-size: 18px; color: ${a.read ? 'var(--ink)' : 'var(--warning)'};">${a.title}</strong>
                <span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; background: ${a.read ? '#e4f4e7' : '#fff2df'}; color: ${a.read ? 'var(--accent2)' : 'var(--warning)'}; white-space: nowrap;">${a.read ? '已读' : '未读'}</span>
              </div>
              <p style="margin: 8px 0; font-size: 15px; line-height: 1.6;">${a.content}</p>
              <p style="margin: 0; font-size: 13px; color: var(--muted);">来源：${a.source || '安心小屏'} · ${a.date}</p>
            </div>
          `).join('')}
        </div>
      `;
    }

    panel.classList.add('active');
  },

  // ========== 摔倒检测状态 ==========
  renderFallCard() {
    const enabled = State.get('fallDetectionEnabled') !== false;
    const detectedAt = State.get('fallDetectedAt');
    const statusEl = document.getElementById('fall-status');
    const hintEl = document.getElementById('fall-hint');
    const card = document.getElementById('fall-card');

    if (!statusEl || !hintEl) return;

    if (!enabled) {
      statusEl.textContent = '已关闭';
      hintEl.textContent = '老人端已关闭检测';
      card.style.borderColor = 'var(--rule)';
      return;
    }

    if (detectedAt && Date.now() - detectedAt < 300000) {
      // 5分钟内检测到摔倒
      statusEl.textContent = '异常';
      statusEl.style.color = 'var(--danger)';
      hintEl.textContent = '刚刚检测到可能摔倒';
      card.style.borderColor = 'var(--danger)';
    } else {
      statusEl.textContent = '正常';
      statusEl.style.color = '';
      hintEl.textContent = '老人端运动监测中';
      card.style.borderColor = 'var(--rule)';
    }
  },

  // ========== 吃药报告 ==========
  renderMedicationReport() {
    const container = document.getElementById('medication-report-body');
    if (!container) return;

    const report = State.getMedicationReport();
    if (!report) {
      container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 20px;">暂无用药提醒数据</p>';
      return;
    }

    const barColor = report.rate >= 80 ? 'var(--accent2)' : report.rate >= 50 ? 'var(--warning)' : 'var(--danger)';

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center;">
          <div style="padding: 14px; background: var(--bg); border-radius: 10px;">
            <strong style="font-size: 28px; color: ${barColor}; display: block;">${report.rate}%</strong>
            <span style="font-size: 12px; color: var(--muted);">依从率</span>
          </div>
          <div style="padding: 14px; background: var(--bg); border-radius: 10px;">
            <strong style="font-size: 28px; color: var(--accent2); display: block;">${report.totalConfirmed}</strong>
            <span style="font-size: 12px; color: var(--muted);">已打卡</span>
          </div>
          <div style="padding: 14px; background: var(--bg); border-radius: 10px;">
            <strong style="font-size: 28px; color: var(--danger); display: block;">${report.missed}</strong>
            <span style="font-size: 12px; color: var(--muted);">遗漏</span>
          </div>
        </div>
        <div style="padding: 14px; background: var(--bg); border-radius: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 13px; color: var(--muted);">依从率</span>
            <span style="font-size: 13px; font-weight: 700; color: ${barColor};">${report.rate}%</span>
          </div>
          <div style="height: 10px; background: var(--rule); border-radius: 5px; overflow: hidden;">
            <div style="height: 100%; width: ${report.rate}%; background: ${barColor}; border-radius: 5px; transition: width 0.5s ease;"></div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; padding: 12px; background: ${report.streak > 2 ? '#e4f4e7' : '#fff8f0'}; border-radius: 10px;">
          <svg viewBox="0 0 20 20" width="20" height="20" style="color: ${report.streak > 2 ? 'var(--accent2)' : 'var(--accent)'};"><path d="M10 2l2.5 5.5L18 8.5l-4 4.5L15 18l-5-3-5 3 1-5-4-4.5L7.5 7.5z" fill="currentColor"/></svg>
          <div>
            <strong style="font-size: 15px;">连续打卡 ${report.streak} 天</strong>
            <p style="margin: 2px 0 0; font-size: 13px; color: var(--muted);">${report.streak >= 7 ? '太棒了！保持这个好习惯！' : report.streak >= 3 ? '不错，继续加油！' : '记得提醒老人按时吃药哦'}</p>
          </div>
        </div>
      </div>
    `;
  },

  // ========== 语音留言 ==========
  renderVoiceMessages() {
    const container = document.getElementById('voice-message-list');
    if (!container) return;

    const msgs = State.getVoiceMessages();
    if (msgs.length === 0) {
      container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 20px;">暂无语音留言</p>';
      return;
    }

    container.innerHTML = msgs.map(m => {
      const date = new Date(m.date);
      const timeStr = date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const isElder = m.from === 'elder';
      return `
        <div style="padding: 14px; background: var(--bg); border-radius: 10px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${isElder ? 'var(--accent)' : 'var(--brand)'}; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; flex-shrink: 0;">
              ${isElder ? '👵' : '👨'}
            </div>
            <div style="flex: 1;">
              <strong style="font-size: 14px;">${isElder ? '老人留言' : '我的回复'}</strong>
              <span style="font-size: 12px; color: var(--muted); margin-left: 8px;">${timeStr}</span>
            </div>
            <button class="btn-secondary" style="padding: 4px 10px; font-size: 12px; color: var(--danger);" onclick="Family.deleteVoiceMessage('${m.id}')">删除</button>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg2); border-radius: 8px; cursor: pointer;" onclick="Family.speakMessage('${m.text.replace(/'/g, "\\'")}')">
            <svg viewBox="0 0 20 20" width="18" height="18" style="color: var(--brand);"><path d="M10 2a3 3 0 013 3v4a3 3 0 01-6 0V5a3 3 0 013-3z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 9v1a5 5 0 0010 0V9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="15" x2="10" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            <span style="font-size: 15px; flex: 1;">${m.text}</span>
            <span style="font-size: 12px; color: var(--muted);">${m.duration || '?'}"</span>
          </div>
        </div>
      `;
    }).join('');
  },

  speakMessage(text) {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  },

  deleteVoiceMessage(id) {
    if (confirm('确定删除这条留言吗？')) {
      State.deleteVoiceMessage(id);
      this.renderVoiceMessages();
    }
  }
};
