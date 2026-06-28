/**
 * 安心小屏 - AI 问助手
 * 支持文字输入和语音输入，接入云端大模型 API
 */

const Assistant = {
  messages: [],
  isProcessing: false,

  init() {
    return this;
  },

  // 显示助手界面（渲染到全屏弹窗）
  show() {
    const body = Elder.getPanelBody();
    if (!body) return;
    this.render(body);

    // 聚焦输入框
    setTimeout(() => {
      const input = document.getElementById('chat-input');
      if (input) input.focus();
    }, 300);
  },

  // 渲染聊天界面
  render(container) {
    container.innerHTML = `
      <div class="assistant-chat" id="chat-messages">
        ${this.messages.length === 0 ? `
          <div class="chat-bubble assistant">
            你好，我是安心助手。你可以问我天气、时间，或者让家人帮你设置提醒。
          </div>
        ` : this.messages.map(m => `
          <div class="chat-bubble ${m.role}">${this.escapeHtml(m.content)}</div>
        `).join('')}
      </div>
      <div class="chat-input-row">
        <input type="text" id="chat-input" placeholder="输入问题，或点语音按钮说话..." 
               onkeypress="if(event.key==='Enter')Assistant.send()">
        <button class="btn-secondary" onclick="Assistant.startVoice()" title="语音输入">🎤</button>
        <button class="btn-primary" onclick="Assistant.send()">发送</button>
      </div>
    `;

    // 滚动到底部
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  },

  // 发送消息
  async send() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || this.isProcessing) return;

    // 添加用户消息
    this.messages.push({ role: 'user', content: text });
    input.value = '';

    const body = Elder.getPanelBody();
    if (body) this.render(body);

    this.isProcessing = true;

    try {
      // 检查是否是本地可回答的问题
      const localResponse = this.getLocalResponse(text);
      if (localResponse) {
        this.messages.push({ role: 'assistant', content: localResponse });
        this.speak(localResponse);
      } else {
        // 调用 AI API
        const response = await this.callAI(text);
        this.messages.push({ role: 'assistant', content: response });
        this.speak(response);
      }
    } catch (error) {
      this.messages.push({ role: 'assistant', content: '抱歉，我暂时无法回答，请稍后再试。' });
    } finally {
      this.isProcessing = false;
      const body2 = Elder.getPanelBody();
      if (body2) this.render(body2);
    }
  },

  // 本地响应（无需联网）
  getLocalResponse(text) {
    const lower = text.toLowerCase();

    // 时间相关
    if (lower.includes('几点') || lower.includes('时间')) {
      const now = new Date();
      return `现在是 ${now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}。`;
    }

    // 日期相关
    if (lower.includes('今天') && (lower.includes('几号') || lower.includes('日期'))) {
      const now = new Date();
      return `今天是 ${now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}。`;
    }

    // 星期相关
    if (lower.includes('星期')) {
      const days = ['日', '一', '二', '三', '四', '五', '六'];
      const now = new Date();
      return `今天是星期${days[now.getDay()]}。`;
    }

    // 问候
    if (lower.includes('你好') || lower.includes('在吗')) {
      return '你好，陈阿姨！有什么我可以帮你的吗？';
    }

    // 提醒相关
    if (lower.includes('提醒') || lower.includes('吃药')) {
      const reminders = State.getPendingReminders();
      if (reminders.length === 0) {
        return '今天没有待完成的提醒。';
      }
      const next = reminders[0];
      return `下一项提醒是 ${next.time} 的${next.title}。`;
    }

    return null;
  },

  // 调用 AI API
  async callAI(text) {
    // 演示模式：模拟 AI 响应
    if (State.get('demoMode')) {
      await this.delay(1000);
      return this.getDemoResponse(text);
    }

    // 真实 API 调用
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: this.messages.slice(-6) })
    });

    if (!response.ok) throw new Error('API 调用失败');
    const data = await response.json();
    return data.reply;
  },

  // 演示模式响应
  getDemoResponse(text) {
    const lower = text.toLowerCase();

    if (lower.includes('天气') || lower.includes('下雨')) {
      return '今天多云，21℃，适合散步。明天可能有小雨，出门记得带伞。';
    }
    if (lower.includes('血压') || lower.includes('健康')) {
      return '血压问题请咨询医生。记得按时吃药，保持心情愉快。';
    }
    if (lower.includes('儿子') || lower.includes('女儿') || lower.includes('家人')) {
      return '家人很关心你。你可以点击"呼叫家人"和他们视频通话。';
    }
    if (lower.includes('故事') || lower.includes('听')) {
      return '你可以点击"听一会儿"按钮，我会给你讲故事或放音乐。';
    }
    if (lower.includes('谢谢')) {
      return '不客气！有需要随时叫我。';
    }

    return '这个问题我记下了，你可以让家人帮你查一下，或者点击"呼叫家人"视频聊聊。';
  },

  // 语音输入
  startVoice() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('您的设备不支持语音输入，请使用文字输入。');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      const btn = document.querySelector('button[onclick="Assistant.startVoice()"]');
      if (btn) btn.textContent = '🔴';
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const input = document.getElementById('chat-input');
      if (input) input.value = transcript;
      this.send();
    };

    recognition.onerror = () => {
      alert('语音识别出错，请重试或使用文字输入。');
    };

    recognition.onend = () => {
      const btn = document.querySelector('button[onclick="Assistant.startVoice()"]');
      if (btn) btn.textContent = '🎤';
    };

    recognition.start();
  },

  // 语音播报
  speak(text) {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      utterance.pitch = 1.1;
      speechSynthesis.speak(utterance);
    }
  },

  // 工具方法
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
