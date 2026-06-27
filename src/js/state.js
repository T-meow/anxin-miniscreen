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
    demoMode: true
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
        triggered: false
      },
      {
        id: 'demo-2',
        title: '喝水',
        type: '喝水',
        time: '10:00',
        note: '早上记得喝一杯温水',
        status: 'done',
        createdAt: Date.now() - 86400000,
        triggered: false
      }
    ];
    this.data = {
      ...this.defaults,
      reminders: demoReminders,
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

State.getPendingReminders = function() {
  return this.getReminders().filter(r => r.status === 'pending');
};

State.getOverdueReminders = function() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  return this.getReminders().filter(r => {
    if (r.status !== 'pending') return false;
    const [h, m] = r.time.split(':').map(Number);
    const reminderTime = h * 60 + m;
    return reminderTime < currentTime;
  });
};
