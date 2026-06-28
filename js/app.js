/**
 * 安心小屏 - 主应用入口
 * 初始化所有模块，处理角色选择和模式切换
 */

const App = {
  currentMode: 'elder',

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

    // 设置子女端返回按钮
    this.setupFamilyBack();

    // 加载演示数据
    const hasData = localStorage.getItem('anxin_state');
    if (!hasData) {
      State.resetDemo();
    }

    // 检查是否已选择角色
    const savedRole = localStorage.getItem('anxin_default_role');
    if (savedRole) {
      // 隐藏角色选择器
      document.getElementById('role-picker').classList.add('hidden');
      // 直接进入对应端
      if (savedRole === 'family') {
        this.switchToFamily(true);
      } else {
        this.switchToElder();
      }
    }

    console.log('安心小屏已启动');
  },

  // 用户选择角色
  pickRole(role) {
    localStorage.setItem('anxin_default_role', role);
    // 隐藏角色选择器
    document.getElementById('role-picker').classList.add('hidden');

    if (role === 'family') {
      this.switchToFamily(true);
    } else {
      this.switchToElder();
    }
  },

  // 设置子女端返回按钮
  setupFamilyBack() {
    const backBtn = document.getElementById('btn-back-elder');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.switchToElder());
    }
  },

  // 从老人端进入子女端
  switchToFamily(silent) {
    // 先关闭弹窗（如果在弹窗内触发的）
    Elder.closePanel();
    Elder.closeModal();

    this.currentMode = 'family';

    // 切换页面
    document.getElementById('elder-screen').classList.remove('active');
    document.getElementById('family-screen').classList.add('active');

    // 刷新子女端数据
    Reminders.renderFamilyList();
    Reminders.updateAlertPanel();

    if (!silent) {
      localStorage.setItem('anxin_default_role', 'family');
    }
  },

  // 从子女端返回老人端
  switchToElder() {
    this.currentMode = 'elder';

    // 切换页面
    document.getElementById('family-screen').classList.remove('active');
    document.getElementById('elder-screen').classList.add('active');

    // 刷新老人端数据
    Reminders.updateNextReminder();

    localStorage.setItem('anxin_default_role', 'elder');
  },

  // 清除角色选择，重新显示选择器
  resetRole() {
    localStorage.removeItem('anxin_default_role');
    location.reload();
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
          <p style="margin-bottom: 10px; color: var(--ink);"><strong>这是一个演示版本，展示了以下功能：</strong></p>
          <ol>
            <li><strong>老人端</strong>：大按钮界面，支持问助手、听故事、查看提醒、呼叫家人</li>
            <li><strong>子女端</strong>：远程添加提醒、查看状态、发起视频通话</li>
            <li><strong>提醒系统</strong>：到点自动弹窗提醒，老人确认后同步到子女端</li>
            <li><strong>AI 助手</strong>：回答天气、时间等问题，支持语音输入</li>
            <li><strong>视频通话</strong>：完整的呼叫、接听、隐私提示流程</li>
          </ol>
          <div class="guide-tip">
            <p style="margin: 0;"><strong>提示：</strong>首次打开会显示角色选择。选"子女"后每次打开会直接进入子女端。点底部"设置"可随时切换。</p>
          </div>
        </div>
        <div style="text-align: center;">
          <button class="btn-primary" onclick="closeDemoGuide()" style="padding: 12px 32px; font-size: 17px;">开始体验</button>
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
