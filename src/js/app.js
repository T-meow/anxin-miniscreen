/**
 * 安心小屏 - 主应用入口
 * 初始化所有模块，处理模式切换
 */

const App = {
  init() {
    // 初始化状态管理
    State.init();

    // 初始化各模块
    Reminders.init();
    Assistant.init();
    Entertainment.init();
    WebRTC.init();
    Elder.init();
    Family.init();

    // 设置模式切换
    this.setupModeSwitch();

    // 加载演示数据
    const hasData = localStorage.getItem('anxin_state');
    if (!hasData) {
      State.resetDemo();
    }

    console.log('安心小屏已启动');
  },

  // 设置老人端/子女端切换
  setupModeSwitch() {
    const buttons = document.querySelectorAll('.mode-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.switchMode(mode);

        // 更新按钮状态
        buttons.forEach(b => {
          b.classList.toggle('active', b.dataset.mode === mode);
          b.setAttribute('aria-selected', b.dataset.mode === mode);
        });
      });
    });
  },

  // 切换模式
  switchMode(mode) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
      screen.classList.remove('active');
    });

    const targetScreen = document.getElementById(`${mode}-screen`);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }

    // 更新状态显示
    if (mode === 'elder') {
      Reminders.updateNextReminder();
    } else if (mode === 'family') {
      Reminders.renderFamilyList();
      Reminders.updateAlertPanel();
    }

    // 清空抽屉
    const drawer = document.getElementById('elder-drawer');
    if (drawer && mode === 'elder') {
      drawer.innerHTML = `
        <div class="drawer-empty">
          <strong>请选择一个大按钮</strong>
          <p>这里会显示问助手、提醒、听一会儿或呼叫家人的内容。</p>
        </div>
      `;
      delete drawer.dataset.view;
    }
  }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  
  // 显示演示引导
  setTimeout(() => {
    showDemoGuide();
  }, 1000);
});

// 演示引导功能
function showDemoGuide() {
  const hasSeenGuide = localStorage.getItem('anxin_guide_seen');
  if (hasSeenGuide) return;
  
  const modal = document.getElementById('modal-layer');
  modal.classList.add('active');
  modal.innerHTML = `
    <div class="demo-guide-overlay">
      <div class="demo-guide-content">
        <h2>欢迎使用安心小屏</h2>
        <div>
          <p style="margin-bottom: 12px; color: var(--ink);"><strong>这是一个演示版本，展示了以下功能：</strong></p>
          <ol>
            <li><strong>老人端</strong>：大按钮界面，支持问助手、听故事、查看提醒、呼叫家人</li>
            <li><strong>子女端</strong>：远程添加提醒、查看状态、发起视频通话</li>
            <li><strong>提醒系统</strong>：到点自动弹窗提醒，老人确认后同步到子女端</li>
            <li><strong>AI 助手</strong>：回答天气、时间等问题，支持语音输入</li>
            <li><strong>视频通话</strong>：完整的呼叫、接听、隐私提示流程</li>
          </ol>
          <div class="guide-tip">
            <p style="margin: 0; font-size: 14px;"><strong>提示：</strong>点击顶部的"老人端"/"子女端"按钮可以切换视角。建议先切换到<strong>子女端</strong>添加提醒，再回到<strong>老人端</strong>查看。</p>
          </div>
        </div>
        <div style="text-align: center;">
          <button class="btn-primary" onclick="closeDemoGuide()" style="padding: 12px 32px; font-size: 18px;">开始体验</button>
        </div>
      </div>
    </div>
  `;
}

function closeDemoGuide() {
  localStorage.setItem('anxin_guide_seen', 'true');
  const modal = document.getElementById('modal-layer');
  modal.innerHTML = '';
  modal.classList.remove('active');
}

// 重置引导（用于演示）
function resetGuide() {
  localStorage.removeItem('anxin_guide_seen');
  showDemoGuide();
}
