/**
 * 安心小屏 - 全局状态管理
 * 使用 localStorage + BroadcastChannel 实现数据持久化和跨标签页同步
 */

const State = {
  // 默认演示数据
  defaults: {
    elderName: '陈阿姨',
    elderAge: 72,
    reminders: [],
    callHistory: [],
    deviceStatus: 'online',
    lastSeen: Date.now(),
    privacyActive: false,
    demoMode: true,
    // 反诈提醒
    fraudAlerts: [],
    lastFraudShown: null,
    // 摔倒检测
    fallDetectionEnabled: true,
    fallDetectedAt: null,
    // 语音留言
    voiceMessages: []
  },

  // 初始化
  init() {
    this.load();
    this.setupSync();
    this.startClock();
    return this;
  },

  // 从 localStorage 加载
  load() {
    const stored = localStorage.getItem('anxin_state');
    if (stored) {
      try {
        this.data = { ...this.defaults, ...JSON.parse(stored) };
      } catch (err) {
        console.warn('本地数据损坏，已重置为演示数据:', err);
        this.data = { ...this.defaults };
        this.save();
      }
    } else {
      this.data = { ...this.defaults };
      this.save();
    }
  },

  // 保存到 localStorage
  save() {
    localStorage.setItem('anxin_state', JSON.stringify(this.data));
  },

  // 获取状态
  get(key) {
    return this.data[key];
  },

  // 设置状态
  set(key, value) {
    this.data[key] = value;
    this.save();
    this.broadcast({ type: 'stateChange', key, value });
  },

  // 批量更新
  update(updates) {
    Object.assign(this.data, updates);
    this.save();
    this.broadcast({ type: 'stateChange', updates });
  },

  // 重置为演示数据
  resetDemo() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay(); // 0-6
    const currentDate = now.getDate(); // 1-31

    // 创建一个即将到期的提醒（2分钟后）
    const reminderTime = new Date(now.getTime() + 2 * 60000);
    const timeStr = `${String(reminderTime.getHours()).padStart(2, '0')}:${String(reminderTime.getMinutes()).padStart(2, '0')}`;

    const demoReminders = [
      {
        id: 'demo-1',
        title: '吃降压药',
        type: '吃药',
        time: timeStr,
        note: '请按医嘱服用，吃过后点"我吃过了"。',
        status: 'pending',
        createdAt: Date.now(),
        triggered: false,
        cycle: 'daily',
        confirmHistory: [],
        missedCount: 0
      },
      {
        id: 'demo-2',
        title: '喝水',
        type: '喝水',
        time: '10:00',
        note: '早上记得喝一杯温水',
        status: 'done',
        createdAt: Date.now() - 86400000,
        triggered: false,
        cycle: 'daily',
        confirmHistory: [{ date: now.toISOString().split('T')[0], time: '10:05' }],
        missedCount: 0
      },
      // 周期性提醒示例
      {
        id: 'demo-3',
        title: '服用福善美（骨质疏松）',
        type: '吃药',
        time: '07:00',
        note: '每周一次，空腹用一大杯清水送服，服药后30分钟内不要躺下。',
        status: 'pending',
        createdAt: Date.now() - 86400000 * 3,
        triggered: false,
        cycle: 'weekly',
        weekDay: 1, // 每周一
        confirmHistory: [],
        missedCount: 0
      },
      {
        id: 'demo-4',
        title: '注射地诺单抗',
        type: '打针',
        time: '09:00',
        note: '每半年一次，到社区卫生站注射。',
        status: 'pending',
        createdAt: Date.now() - 86400000 * 30,
        triggered: false,
        cycle: 'custom',
        everyNDays: 180, // 每半年
        confirmHistory: [{ date: '2026-01-15', time: '09:30' }],
        missedCount: 0
      }
    ];
    // 反诈提醒演示数据
    const demoFraudAlerts = [
      {
        id: 'fraud-1',
        title: '警惕冒充公检法诈骗',
        content: '近期有不法分子冒充警察或法院工作人员，谎称老人涉嫌洗钱案件，要求转账到"安全账户"。请牢记：公检法不会通过电话要求转账！遇到此类电话请立即挂断并联系家人。',
        date: now.toISOString().split('T')[0],
        read: false,
        source: '社区反诈中心'
      },
      {
        id: 'fraud-2',
        title: '防范保健品诈骗',
        content: '有不法分子以"免费体检""专家义诊"为名推销高价保健品。请提醒老人：身体不适请去正规医院，不要轻信街头推销和陌生电话推销的保健品。',
        date: new Date(now.getTime() - 86400000 * 2).toISOString().split('T')[0],
        read: true,
        source: '社区反诈中心'
      }
    ];

    // 语音留言演示数据
    const demoVoiceMessages = [
      {
        id: 'vm-1',
        from: 'elder',
        text: '儿子，我降压药吃完了，记得帮我买一瓶。',
        date: new Date(now.getTime() - 86400000 * 0.5).toISOString(),
        duration: 5
      }
    ];

    this.data = {
      ...this.defaults,
      reminders: demoReminders,
      fraudAlerts: demoFraudAlerts,
      voiceMessages: demoVoiceMessages,
      demoMode: true
    };
    this.save();
    this.broadcast({ type: 'reset' });

    // 显示提示
    setTimeout(() => {
      if (typeof showDemoGuide === 'function') {
        showDemoGuide();
      }
    }, 500);
  },

  // BroadcastChannel 同步
  setupSync() {
    if ('BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('anxin_sync');
      this.channel.onmessage = (event) => {
        const { type, key, value, updates } = event.data;
        if (type === 'stateChange') {
          if (updates) {
            Object.assign(this.data, updates);
          } else {
            this.data[key] = value;
          }
          this.save();
          this.emit('sync', event.data);
        } else if (type === 'reset') {
          this.load();
          this.emit('sync', event.data);
        }
      };
    }
  },

  broadcast(message) {
    if (this.channel) {
      this.channel.postMessage(message);
    }
  },

  // 简单事件系统
  listeners: {},
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  },
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  },
  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => cb(data));
  },

  // 时钟更新
  startClock() {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' });
      const timeEl = document.getElementById('clock-time');
      const dateEl = document.getElementById('clock-date');
      if (timeEl) timeEl.textContent = timeStr;
      if (dateEl) dateEl.textContent = dateStr;
    };
    updateClock();
    setInterval(updateClock, 1000);
  }
};

// 提醒相关方法
State.getReminders = function() {
  return this.get('reminders') || [];
};

State.addReminder = function(reminder) {
  const reminders = this.getReminders();
  reminders.push({
    id: 'r-' + Date.now(),
    status: 'pending',
    createdAt: Date.now(),
    confirmHistory: [],
    missedCount: 0,
    ...reminder
  });
  this.set('reminders', reminders);
};

State.updateReminder = function(id, updates) {
  const reminders = this.getReminders();
  const idx = reminders.findIndex(r => r.id === id);
  if (idx !== -1) {
    reminders[idx] = { ...reminders[idx], ...updates };
    this.set('reminders', reminders);
  }
};

State.deleteReminder = function(id) {
  const reminders = this.getReminders().filter(r => r.id !== id);
  this.set('reminders', reminders);
};

// 获取今日待处理的提醒（包括一次性提醒和今天该触发的周期性提醒）
State.getPendingReminders = function() {
  return this.getReminders().filter(r => {
    if (!r.cycle || r.cycle === 'daily') {
      return r.status === 'pending';
    }
    // 周期性提醒：今天是否需要触发
    return this.isReminderDueToday(r);
  });
};

// 判断周期性提醒今天是否该触发
State.isReminderDueToday = function(r) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayDay = today.getDay(); // 0-6
  const todayDate = today.getDate(); // 1-31

  // 检查今天是否已经打卡
  const alreadyConfirmedToday = (r.confirmHistory || []).some(h => h.date === todayStr);
  if (alreadyConfirmedToday) return false;

  if (!r.cycle || r.cycle === 'daily') {
    return r.status === 'pending';
  }

  if (r.cycle === 'weekly') {
    // 今天是否是对应的星期几
    return todayDay === (r.weekDay ?? 0);
  }

  if (r.cycle === 'monthly') {
    // 今天是否是对应的日期
    return todayDate === (r.monthDay ?? 1);
  }

  if (r.cycle === 'custom' && r.everyNDays) {
    // 距离上次打卡是否超过N天
    if (!r.confirmHistory || r.confirmHistory.length === 0) {
      // 从未打卡过，检查距离创建日期
      const created = new Date(r.createdAt);
      const daysSinceCreated = Math.floor((today - created) / 86400000);
      return daysSinceCreated >= r.everyNDays;
    }
    const lastDate = new Date(r.confirmHistory[r.confirmHistory.length - 1].date);
    const daysSince = Math.floor((today - lastDate) / 86400000);
    return daysSince >= r.everyNDays;
  }

  return false;
};

// 获取已逾期的提醒
State.getOverdueReminders = function() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  return this.getReminders().filter(r => {
    // 只有今天该触发的提醒才算逾期
    if (!this.isReminderDueToday(r)) return false;

    const [h, m] = r.time.split(':').map(Number);
    const reminderTime = h * 60 + m;
    return reminderTime < currentTime;
  });
};

// ========== 反诈提醒 ==========
State.getFraudAlerts = function() {
  return this.get('fraudAlerts') || [];
};

State.addFraudAlert = function(alert) {
  const alerts = this.getFraudAlerts();
  alerts.unshift({
    id: 'fraud-' + Date.now(),
    read: false,
    date: new Date().toISOString().split('T')[0],
    ...alert
  });
  this.set('fraudAlerts', alerts);
};

State.markFraudRead = function(id) {
  const alerts = this.getFraudAlerts();
  const idx = alerts.findIndex(a => a.id === id);
  if (idx !== -1) {
    alerts[idx].read = true;
    this.set('fraudAlerts', alerts);
  }
};

// ========== 语音留言 ==========
State.getVoiceMessages = function() {
  return this.get('voiceMessages') || [];
};

State.addVoiceMessage = function(msg) {
  const msgs = this.getVoiceMessages();
  msgs.unshift({
    id: 'vm-' + Date.now(),
    date: new Date().toISOString(),
    ...msg
  });
  this.set('voiceMessages', msgs);
};

State.deleteVoiceMessage = function(id) {
  const msgs = this.getVoiceMessages().filter(m => m.id !== id);
  this.set('voiceMessages', msgs);
};

// ========== 吃药报告统计 ==========
State.getMedicationReport = function() {
  const reminders = this.getReminders().filter(r => r.type === '吃药' || r.type === '打针');
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  let totalDue = 0;
  let totalConfirmed = 0;
  let missed = 0;

  reminders.forEach(r => {
    // 统计最近7天内的打卡记录
    const weekHistory = (r.confirmHistory || []).filter(h => new Date(h.date) >= weekAgo);
    totalConfirmed += weekHistory.length;

    // 估算应完成次数（简化计算）
    if (!r.cycle || r.cycle === 'daily') {
      totalDue += 7;
    } else if (r.cycle === 'weekly') {
      totalDue += 1;
    } else if (r.cycle === 'monthly') {
      totalDue += 1;
    } else if (r.cycle === 'custom' && r.everyNDays) {
      totalDue += Math.floor(7 / r.everyNDays) + 1;
    }
  });

  // 如果没有提醒，返回空
  if (reminders.length === 0) return null;

  missed = Math.max(0, totalDue - totalConfirmed);
  const rate = totalDue > 0 ? Math.round((totalConfirmed / totalDue) * 100) : 0;

  return {
    totalDue,
    totalConfirmed,
    missed,
    rate,
    streak: this._calcStreak(reminders),
    remindersCount: reminders.length
  };
};

State._calcStreak = function(reminders) {
  // 计算连续打卡天数
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    const dStr = d.toISOString().split('T')[0];
    const hasConfirm = reminders.some(r =>
      (r.confirmHistory || []).some(h => h.date === dStr)
    );
    if (hasConfirm) {
      streak++;
    } else if (i === 0) {
      streak = 0;
    } else {
      break;
    }
  }
  return streak;
};

// 获取周期性提醒的下次提醒日期描述
State.getNextReminderDate = function(r) {
  if (!r.cycle || r.cycle === 'daily') return '每天';

  const today = new Date();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  if (r.cycle === 'weekly') {
    return `每周${weekDays[r.weekDay ?? 0]}`;
  }

  if (r.cycle === 'monthly') {
    return `每月${r.monthDay ?? 1}号`;
  }

  if (r.cycle === 'custom' && r.everyNDays) {
    if (r.everyNDays >= 30) {
      const months = Math.round(r.everyNDays / 30);
      return `每${months}个月`;
    }
    return `每${r.everyNDays}天`;
  }

  return '';
};
