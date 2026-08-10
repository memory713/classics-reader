<template>
  <div v-if="store.state.loaded && store.state.phone" class="app-root">
    <!-- 顶部导航 -->
    <header id="topBar">
      <div class="header-left">
        <h1 class="game-title">岐黄问道录</h1>
        <span class="game-subtitle">黄帝内经 · 修行之旅</span>
      </div>
      <div class="header-right"></div>
    </header>

    <div class="main-container">
      <!-- 侧边导航 -->
      <nav id="sideNav">
        <button v-for="nav in navs" :key="nav.view"
          :class="['nav-btn', { active: store.state.currentView === nav.view || (nav.view === 'profile' && store.state.currentView === 'rankings') }]"
          @click="store.goTo(nav.view)" :title="nav.label">
          <span class="nav-icon">{{ nav.icon }}</span>
          <span class="nav-text">{{ nav.label }}</span>
        </button>
      </nav>

      <main id="mainContent">
        <Reading v-show="store.state.currentView === 'reading'" />
        <HerbGathering v-show="store.state.currentView === 'gathering'" />
        <Clinic v-show="store.state.currentView === 'clinic'" />
        <Achievements v-show="store.state.currentView === 'achievements'" />
        <Rankings v-show="store.state.currentView === 'rankings'" />
        <Profile v-show="store.state.currentView === 'profile'" />
      </main>
    </div>

    <!-- Toast（烟花版） -->
    <Teleport to="body">
      <div v-if="toast.msg" class="toast-notification" :class="toast.type" :style="toastStyle">
        <span class="toast-text">{{ toast.msg }}</span>
        <span v-if="toast.type === 'firework'" class="firework-particles">
          <i v-for="n in 20" :key="n" class="fp" :style="fireworkStyle(n)"></i>
        </span>
      </div>
    </Teleport>
  </div>
  <div v-else-if="!store.state.phone" class="loading-screen">
    <div class="login-box">
      <h2>🏥 岐黄问道录</h2>
      <p class="login-sub">请输入手机号开始修行</p>
      <input
        class="phone-input"
        :class="{ 'input-error': inputError }"
        v-model="phoneInput"
        @keyup.enter="doLogin"
        @input="inputError = false; errorMsg = ''"
        placeholder="输入11位手机号"
        maxlength="11"
        type="tel"
      />
      <div v-if="errorMsg" class="login-error">{{ errorMsg }}</div>
      <button class="btn btn-primary btn-lg" @click="doLogin" :disabled="loggingIn">
        {{ loggingIn ? '登录中...' : '开始修行' }}
      </button>
      <p class="login-hint">手机号仅作身份标识，无需密码</p>
    </div>
  </div>
  <div v-else class="loading-screen">
    <div class="spinner"></div>
    <p>加载中...</p>
  </div>
</template>

<script setup>
import { reactive, computed, ref, onMounted } from 'vue'
import { useGameStore } from '@/stores/gameStore.js'
import Reading from '@/views/Reading.vue'
import HerbGathering from '@/views/HerbGathering.vue'
import Clinic from '@/views/Clinic.vue'
import Achievements from '@/views/Achievements.vue'
import Rankings from '@/views/Rankings.vue'
import Profile from '@/views/Profile.vue'

const store = useGameStore()
const phoneInput = ref('13958243103')
const loggingIn = ref(false)
const inputError = ref(false)
const errorMsg = ref('')

const navs = [
  { view: 'clinic', icon: '🏥', label: '医馆' },
  { view: 'reading', icon: '📖', label: '研读' },
  { view: 'gathering', icon: '🌿', label: '采药' },
  { view: 'profile', icon: '🧑', label: '个人' }
]

// Toast（5秒 + 烟花/错误特效）
const toast = reactive({ msg: '', timer: null, type: '' })
const toastStyle = computed(() => ({
  position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
  background: toast.type === 'error'
    ? 'linear-gradient(135deg, rgba(200,76,76,0.15), rgba(200,76,76,0.05))'
    : toast.type === 'firework'
    ? 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))'
    : 'var(--bg-card)',
  color: toast.type === 'error' ? 'var(--accent-red)' : 'var(--text-primary)',
  padding: '16px 32px', borderRadius: '12px',
  border: toast.type === 'error'
    ? '2px solid var(--accent-red)'
    : toast.type === 'firework'
    ? '2px solid var(--accent-gold)'
    : '1px solid var(--accent-gold)',
  boxShadow: toast.type === 'error'
    ? '0 0 30px rgba(200,76,76,0.3), 0 4px 20px rgba(0,0,0,0.5)'
    : toast.type === 'firework'
    ? '0 0 40px rgba(201,168,76,0.3), 0 4px 20px rgba(0,0,0,0.5)'
    : '0 4px 20px rgba(0,0,0,0.5)',
  zIndex: 2000,
  fontFamily: 'var(--font-body)', fontSize: '16px',
  maxWidth: '80%', textAlign: 'center',
  opacity: toast.msg ? 1 : 0, transition: 'all 0.5s ease',
  overflow: 'hidden',
  animation: toast.msg ? (toast.type === 'error' ? 'shake 0.4s ease-out' : 'toastPop 0.4s ease-out') : 'none'
}))

function fireworkStyle(n) {
  const angle = (n / 20) * 360
  const dist = 60 + Math.random() * 80
  const x = Math.cos(angle * Math.PI / 180) * dist
  const y = Math.sin(angle * Math.PI / 180) * dist
  const colors = ['#f9d423','#ff4e50','#6af','#5f5','#f5a','#ff8c00','#0ff','#f0f']
  const color = colors[n % colors.length]
  const delay = Math.random() * 0.3
  const size = 3 + Math.random() * 5
  return {
    '--x': x + 'px', '--y': y + 'px', '--c': color, '--d': delay + 's',
    '--s': size + 'px', position: 'absolute', left: '50%', top: '50%',
    width: 'var(--s)', height: 'var(--s)', borderRadius: '50%',
    background: 'var(--c)', animation: `fireworkBurst 1.2s var(--d) ease-out forwards`,
    pointerEvents: 'none'
  }
}

function showToast(msg, type = '') {
  if (toast.timer) clearTimeout(toast.timer)
  toast.msg = msg
  toast.type = type
  toast.timer = setTimeout(() => { toast.msg = ''; toast.type = '' }, 5000)
}

window.addEventListener('show-toast', (e) => showToast(e.detail))
window.addEventListener('show-firework', (e) => showToast(e.detail, 'firework'))
window.addEventListener('show-error', (e) => showToast(e.detail, 'error'))

async function doLogin() {
  const p = phoneInput.value.trim()
  if (!/^1[3-9]\d{9}$/.test(p)) {
    errorMsg.value = '⚠️ 手机号格式有误（1开头，第二位3-9）'
    inputError.value = true
    return
  }
  loggingIn.value = true
  try {
    const result = await store.login(p)
    showToast(result.isNew ? '🎉 新道友，欢迎踏入修行之路！' : '🙏 欢迎回来，继续修行！')
  } catch (e) {
    showToast('⚠️ ' + e.message, 'error')
  }
  loggingIn.value = false
}

onMounted(async () => {
  // 清理旧版 phone 缓存
  localStorage.removeItem('qihuang_phone')
  // 自动登录（token 方式）
  const token = localStorage.getItem('qihuang_token')
  if (token) {
    const ok = await store.tokenLogin(token)
    if (!ok) localStorage.removeItem('qihuang_token')
  }
  if (!store.state.phone) {
    store.state.loaded = true // 显示登录界面
  }
})
</script>

<style>
.loading-screen {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100vh; background: var(--bg-primary); color: var(--text-muted); gap: 16px;
}
.loading-screen .spinner {
  width: 32px; height: 32px; border: 3px solid var(--border-color);
  border-top-color: var(--accent-gold); border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.username-input {
  width: 80px; padding: 2px 8px; background: var(--bg-secondary);
  border: 1px solid var(--border-color); border-radius: 10px;
  color: var(--text-secondary); font-size: 12px; font-family: var(--font-body);
}
.username-input:focus { outline: none; border-color: var(--accent-gold); }

/* 烟花粒子动画 */
@keyframes fireworkBurst {
  0%   { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--x), var(--y)) scale(0); opacity: 0; }
}
.toast-notification.firework {
  animation: toastPop 0.4s ease-out;
}
@keyframes toastPop {
  0%   { transform: translateX(-50%) scale(0.7); opacity: 0; }
  60%  { transform: translateX(-50%) scale(1.05); }
  100% { transform: translateX(-50%) scale(1); opacity: 1; }
}
.toast-text { position: relative; z-index: 1; }

/* 登录页 */
.login-box {
  background: var(--bg-card); border: 1px solid var(--accent-gold);
  border-radius: 16px; padding: 40px; text-align: center;
  max-width: 380px; width: 90%;
  box-shadow: 0 8px 40px rgba(0,0,0,0.4);
}
.login-box h2 { font-family: var(--font-decorative); color: var(--accent-gold); font-size: 28px; margin-bottom: 8px; }
.login-sub { color: var(--text-muted); font-size: 14px; margin-bottom: 24px; }
.phone-input {
  width: 100%; padding: 14px 18px; font-size: 20px; text-align: center;
  background: var(--bg-secondary); border: 2px solid var(--border-color);
  border-radius: 10px; color: var(--text-primary); font-family: var(--font-body);
  letter-spacing: 4px; margin-bottom: 16px; transition: border-color 0.2s;
}
.phone-input:focus { outline: none; border-color: var(--accent-gold); }
.phone-input.input-error { border-color: var(--accent-red); animation: shake 0.4s ease-out; }
.login-error { color: var(--accent-red); font-size: 13px; margin: -8px 0 12px; padding: 8px 12px; background: rgba(200,76,76,0.1); border-radius: 8px; border: 1px solid rgba(200,76,76,0.3); }
.login-hint { font-size: 12px; color: var(--text-muted); margin-top: 16px; }
/* 错误弹窗抖动动画 */
@keyframes shake {
  0%, 100% { transform: translateX(-50%) translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-50%) translateX(-6px); }
  20%, 40%, 60%, 80% { transform: translateX(-50%) translateX(6px); }
}
.btn-logout {
  background: none; border: none; color: var(--text-muted); cursor: pointer;
  font-size: 14px; padding: 0 4px; margin-left: 4px;
}
.btn-logout:hover { color: var(--accent-red); }
</style>
