/**
 * 安心小屏 - 娱乐陪伴
 * 内置故事和音乐播放，支持播放控制
 */

const Entertainment = {
  currentTrack: null,
  isPlaying: false,
  audio: null,

  // 内置内容列表
  tracks: [
    {
      id: 'story-1',
      title: '睡前故事：小猫钓鱼',
      type: 'story',
      duration: '5分钟',
      description: '一只小猫学钓鱼的故事，温馨有趣。'
    },
    {
      id: 'story-2',
      title: '经典评书：三国演义',
      type: 'story',
      duration: '15分钟',
      description: '桃园三结义，英雄出少年。'
    },
    {
      id: 'music-1',
      title: '轻音乐：春江花月夜',
      type: 'music',
      duration: '8分钟',
      description: '古典民乐，舒缓心情。'
    },
    {
      id: 'music-2',
      title: '老歌精选：茉莉花',
      type: 'music',
      duration: '4分钟',
      description: '经典民歌，耳熟能详。'
    }
  ],

  init() {
    return this;
  },

  // 显示娱乐界面
  show() {
    const drawer = document.getElementById('elder-drawer');
    drawer.dataset.view = 'entertainment';
    this.renderList();
  },

  // 渲染列表
  renderList() {
    const drawer = document.getElementById('elder-drawer');
    drawer.innerHTML = `
      <h3 style="margin-bottom: 16px;">听一会儿</h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${this.tracks.map(t => `
          <div style="padding: 16px; background: var(--bg); border-radius: 12px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s;"
               onmouseover="this.style.borderColor='var(--accent)'" 
               onmouseout="this.style.borderColor='transparent'"
               onclick="Entertainment.play('${t.id}')">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 18px;">${t.title}</strong>
                <span style="margin-left: 8px; padding: 2px 8px; background: var(--accent); color: white; border-radius: 4px; font-size: 12px;">${t.type === 'story' ? '故事' : '音乐'}</span>
              </div>
              <span style="color: var(--muted); font-size: 14px;">${t.duration}</span>
            </div>
            <p style="margin: 8px 0 0; color: var(--muted); font-size: 14px;">${t.description}</p>
          </div>
        `).join('')}
      </div>
    `;
  },

  // 播放
  play(trackId) {
    const track = this.tracks.find(t => t.id === trackId);
    if (!track) return;

    this.currentTrack = track;
    this.isPlaying = true;

    // 创建音频对象（演示模式使用占位音频）
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }

    // 演示模式：模拟播放
    if (State.get('demoMode')) {
      this.renderPlayer();
      this.speak(`开始播放：${track.title}`);
      return;
    }

    // 真实播放
    this.audio = new Audio(`assets/audio/${track.id}.mp3`);
    this.audio.play();
    this.audio.onended = () => {
      this.isPlaying = false;
      this.renderPlayer();
    };

    this.renderPlayer();
  },

  // 暂停/继续
  toggle() {
    if (!this.currentTrack) return;

    if (this.isPlaying) {
      this.isPlaying = false;
      if (this.audio) this.audio.pause();
    } else {
      this.isPlaying = true;
      if (this.audio) {
        this.audio.play();
      } else {
        this.play(this.currentTrack.id);
        return;
      }
    }
    this.renderPlayer();
  },

  // 停止
  stop() {
    this.isPlaying = false;
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.renderPlayer();
  },

  // 下一首
  next() {
    if (!this.currentTrack) return;
    const idx = this.tracks.findIndex(t => t.id === this.currentTrack.id);
    const nextIdx = (idx + 1) % this.tracks.length;
    this.play(this.tracks[nextIdx].id);
  },

  // 上一首
  prev() {
    if (!this.currentTrack) return;
    const idx = this.tracks.findIndex(t => t.id === this.currentTrack.id);
    const prevIdx = (idx - 1 + this.tracks.length) % this.tracks.length;
    this.play(this.tracks[prevIdx].id);
  },

  // 渲染播放器
  renderPlayer() {
    const drawer = document.getElementById('elder-drawer');
    if (!this.currentTrack) {
      this.renderList();
      return;
    }

    const icon = this.currentTrack.type === 'story' ? '📖' : '🎵';
    const playIcon = this.isPlaying ? '⏸' : '▶';

    drawer.innerHTML = `
      <div class="entertainment-player">
        <div class="player-cover">${icon}</div>
        <h3 style="margin-bottom: 4px;">${this.currentTrack.title}</h3>
        <p style="color: var(--muted); margin-bottom: 20px;">${this.currentTrack.description}</p>
        
        <div style="width: 100%; height: 4px; background: var(--rule); border-radius: 2px; margin-bottom: 20px;">
          <div style="width: ${this.isPlaying ? '60%' : '0%'}; height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.3s;"></div>
        </div>
        
        <div class="player-controls">
          <button class="player-btn" onclick="Entertainment.prev()">⏮</button>
          <button class="player-btn primary" onclick="Entertainment.toggle()">${playIcon}</button>
          <button class="player-btn" onclick="Entertainment.next()">⏭</button>
          <button class="player-btn" onclick="Entertainment.stop()">⏹</button>
        </div>
        
        <button class="btn-secondary" style="margin-top: 20px;" onclick="Entertainment.renderList()">返回列表</button>
      </div>
    `;
  },

  // 语音播报
  speak(text) {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }
};
