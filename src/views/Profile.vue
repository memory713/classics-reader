<template>
  <section class="view active">
    <div class="profile-root">
      <!-- 导航入口 -->
      <div class="profile-nav">
        <button class="pn-btn" @click="store.goTo('rankings')">📊 排行</button>
      </div>

      <!-- 每日任务 -->
      <div class="info-card">
        <h3>🗓️ 每日任务</h3>
        <div class="daily-tasks">
          <div v-for="t in dailyTasks" :key="t.key" :class="['task-item', { completed: t.done }]">
            <span class="task-check">{{ t.done ? '☑' : '☐' }}</span>
            <span class="task-label">{{ t.label }}</span>
            <span class="task-reward">{{ t.reward }}</span>
          </div>
        </div>
        <div class="daily-bonus" v-if="allTasksDone && !bonusClaimed">
          <button class="btn btn-primary btn-sm" @click="claimBonus">🎁 领取全完成奖励 +200金 +20声望</button>
        </div>
        <div class="daily-bonus claimed" v-else-if="bonusClaimed">✅ 今日全完成奖励已领取</div>
        <div class="streak-info">连续修行：<span class="highlight">{{ state.streak }}</span> 天</div>
      </div>

      <!-- 状态概览 -->
      <div class="info-card">
        <h3>📊 当前状态</h3>
        <div class="stats-row">
          <div class="stat-box clickable" @click="showStatHistory('mind')"><span class="sb-icon">❤</span><span class="sb-label">心神</span><span class="sb-value">{{ state.mind }}</span><span class="sb-max">/{{ state.maxMind }}</span><span v-if="statCounts.mind" class="sb-badge">{{ statCounts.mind }}</span></div>
          <div class="stat-box clickable" @click="showStatHistory('rep')"><span class="sb-icon">⭐</span><span class="sb-label">声望</span><span class="sb-value">{{ state.reputation.toLocaleString() }}</span><span v-if="statCounts.rep" class="sb-badge">{{ statCounts.rep }}</span></div>
          <div class="stat-box clickable" @click="showStatHistory('money')"><span class="sb-icon">💰</span><span class="sb-label">金钱</span><span class="sb-value">{{ state.money.toLocaleString() }}</span><span v-if="statCounts.money" class="sb-badge">{{ statCounts.money }}</span></div>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="info-card">
        <h3>🧑 基本信息</h3>
        <div class="cultivator-details">
          <div class="detail-row">
            <span class="detail-label">昵称</span>
            <template v-if="!editingNick">
              <span class="detail-value nickname-display" @click="startEditNick" :title="state.nicknameChanged ? '昵称已锁定' : '点击修改（仅一次）'">
                {{ state.nickname || state.playerName }}
                <span v-if="!state.nicknameChanged" class="nick-edit-hint">✎</span>
              </span>
            </template>
            <template v-else>
              <div class="nick-edit-row">
                <input class="nickname-input" v-model="nickInput" @keyup.enter="doChangeNick" maxlength="12" ref="nickInputRef" />
                <button class="btn btn-sm btn-primary" @click="doChangeNick" :disabled="!nickInput.trim()">确认</button>
                <button class="btn btn-sm btn-secondary" @click="cancelEditNick">取消</button>
              </div>
            </template>
          </div>
          <div class="detail-row"><span class="detail-label">手机号</span><span class="detail-value">{{ state.phone }}</span></div>
          <div class="detail-row"><span class="detail-label">医馆</span><span class="detail-value">{{ clinicName }} · LV{{ state.clinicLevel }}</span></div>
          <div class="detail-row"><span class="detail-label">所在</span><span class="detail-value">{{ cityName }}</span></div>
          <div class="detail-row"><span class="detail-label">已读章节</span><span class="detail-value">{{ readCount }} / 162</span></div>
          <div class="detail-row logout-row">
            <button class="btn btn-secondary" @click="doLogout">↪ 退出登录</button>
          </div>
        </div>
      </div>

      <!-- 研读进度 -->
      <div class="info-card">
        <h3>📚 研读进度</h3>
        <div class="reading-dash">
          <div class="progress-track"><div class="progress-fill" :style="{width: (readCount/162*100)+'%'}"></div></div>
          <div class="rd-detail"><span>素问 {{ sw.done }}/{{ sw.total }}</span><span>灵枢 {{ ls.done }}/{{ ls.total }}</span></div>
        </div>
      </div>

      <!-- 修行日志 -->
      <div class="info-card log-card">
        <h3>📜 修行日志</h3>
        <div class="activity-log">
          <p v-if="state.activityLog.length === 0" class="log-empty">开始你的修行之旅吧！</p>
          <div v-for="(log, i) in state.activityLog.slice(0, 20)" :key="i" class="log-entry">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-text">{{ log.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计历史弹窗 -->
    <Teleport to="body">
      <div v-if="statModal" class="stat-modal-overlay" @click.self="statModal = null">
        <div class="stat-modal">
          <div class="stat-modal-header">
            <span>{{ statModalTitle }}</span>
            <button class="stat-modal-close" @click="statModal = null">✕</button>
          </div>
          <div class="stat-modal-body">
            <div v-for="(item, i) in filteredStatHistory" :key="i" class="stat-item">
              <span class="si-time">{{ item.time }}</span>
              <span :class="['si-amount', item.amount >= 0 ? 'positive' : 'negative']">{{ item.amount >= 0 ? '+' : '' }}{{ item.amount }}</span>
              <span class="si-reason">{{ item.reason }}</span>
            </div>
            <div v-if="filteredStatHistory.length === 0" class="stat-empty">暂无记录</div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useGameStore } from '@/stores/gameStore.js'

const store = useGameStore()
const { state, readCount, CITIES } = store

const cityName = computed(() => CITIES[state.cityIndex]?.name || '青云村')
const clinicName = computed(() => state.clinicLevel >= 50 ? '岐黄大医馆' : state.clinicLevel >= 20 ? '岐黄医馆' : '岐黄小医馆')
const sw = computed(() => {
  const done = state.readChapters.filter(id => id <= 81).length
  return { done, total: 81 }
})
const ls = computed(() => {
  const done = state.readChapters.filter(id => id > 81).length
  return { done, total: 81 }
})

const dailyTasks = computed(() => [
  { key: 'read', label: '今日研读一章', reward: '+100金 +10声望', done: state.dailyTasks.read },
  { key: 'quiz', label: '完成一次小测', reward: '+80金 +8声望', done: state.dailyTasks.quiz },
  { key: 'login', label: '登录签到', reward: '+50金 +5声望', done: state.dailyTasks.login }
])

const allTasksDone = computed(() =>
  state.dailyTasks.read && state.dailyTasks.quiz && state.dailyTasks.login
)

const bonusClaimed = computed(() => state.dailyBonusClaimed)

// 各统计的历史条目数（角标）
const statCounts = computed(() => ({
  mind: (state.statHistory || []).filter(s => s.type === 'mind').length,
  rep: (state.statHistory || []).filter(s => s.type === 'rep').length,
  money: (state.statHistory || []).filter(s => s.type === 'money').length
}))

// 统计历史弹窗
const statModal = ref(null)
const statModalTitle = computed(() => {
  const labels = { mind: '❤ 心神变动', rep: '⭐ 声望变动', money: '💰 金钱变动' }
  return labels[statModal.value] || ''
})
const filteredStatHistory = computed(() => {
  if (!statModal.value) return []
  return (state.statHistory || []).filter(item => item.type === statModal.value).slice(0, 100)
})
function showStatHistory(type) { statModal.value = type }

function claimBonus() {
  if (!allTasksDone.value || state.dailyBonusClaimed) return
  state.money += 200
  state.reputation += 20
  state.dailyBonusClaimed = true
  store._trackStat('money', 200, '每日任务-全完成奖励')
  store._trackStat('rep', 20, '每日任务-全完成奖励')
  store.save()
  window.dispatchEvent(new CustomEvent('show-firework', { detail: '🎉 完成全部每日任务！+200金 +20声望' }))
}

// 昵称修改
const editingNick = ref(false)
const nickInput = ref('')
const nickInputRef = ref(null)

function startEditNick() {
  if (state.nicknameChanged) return
  editingNick.value = true
  nickInput.value = state.nickname || ''
  nextTick(() => nickInputRef.value?.focus())
}
async function doChangeNick() {
  const nn = nickInput.value.trim()
  if (!nn || nn.length < 1 || nn.length > 12) return
  await store.changeNickname(nn)
  editingNick.value = false
  window.dispatchEvent(new CustomEvent('show-toast', { detail: `✅ 昵称已设为「${nn}」` }))
}
function cancelEditNick() {
  editingNick.value = false
}

async function doLogout() {
  await store.logout()
  window.location.reload()
}
</script>

<style scoped>
.profile-root { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
.profile-nav { display: flex; gap: 8px; }
.pn-btn {
  flex: 1; padding: 12px 8px; background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 10px; color: var(--text-secondary); font-size: 14px; cursor: pointer;
  font-family: var(--font-body); transition: all 0.2s;
}
.pn-btn:hover { border-color: var(--accent-gold); color: var(--accent-gold); background: rgba(201,168,76,0.06); }
.info-card {
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 12px; padding: 20px;
}
.info-card h3 { font-family: var(--font-decorative); color: var(--accent-gold); font-size: 16px; margin-bottom: 12px; }

/* 状态概览 */
.stats-row { display: flex; gap: 12px; }
.stat-box {
  flex: 1; text-align: center; padding: 12px 8px;
  background: var(--bg-secondary); border-radius: 10px;
  border: 1px solid var(--border-color);
}
.sb-icon { font-size: 20px; display: block; margin-bottom: 4px; }
.sb-label { font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px; }
.sb-value { font-size: 20px; font-weight: 700; color: var(--accent-gold); }

.sb-max { font-size: 12px; color: var(--text-muted); }

/* 档案 */
.cultivator-details { display: flex; flex-direction: column; gap: 8px; }
.detail-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; padding: 4px 0; border-bottom: 1px solid var(--border-color); }
.detail-label { color: var(--text-muted); }
.detail-value { color: var(--text-primary); }
.detail-value.gold-text { color: var(--accent-gold); }
.detail-value.rep-text { color: var(--accent-green); }
.nickname-display { cursor: pointer; transition: color 0.2s; }
.nickname-display:hover { color: var(--accent-gold); }
.nick-edit-hint { font-size: 10px; color: var(--text-muted); margin-left: 4px; opacity: 0; transition: opacity 0.2s; }
.nickname-display:hover .nick-edit-hint { opacity: 1; }
.nick-edit-row { display: flex; align-items: center; gap: 6px; }
.nickname-input {
  flex: 1; min-width: 80px; padding: 6px 10px; background: var(--bg-secondary);
  border: 1px solid var(--accent-gold); border-radius: 8px;
  color: var(--text-primary); font-size: 14px;
}
.nickname-input:focus { outline: none; }
.nick-edit-row .btn { padding: 4px 12px; font-size: 12px; }
.logout-row { border-bottom:none; padding-top:8px; justify-content:center; }
.logout-row .btn { width:100%; }

/* 日志 */
.log-card { max-height: 400px; overflow-y: auto; }
.activity-log { display: flex; flex-direction: column; gap: 6px; }
.log-empty { text-align: center; color: var(--text-muted); padding: 40px 0; font-size: 14px; }
.log-entry { display: flex; gap: 8px; font-size: 14px; }
.log-time { color: var(--text-muted); white-space: nowrap; font-size: 11px; line-height: 1.8; }
.log-text { color: var(--text-secondary); line-height: 1.8; }

/* 研读进度 */
.reading-dash { }
.progress-track { width: 100%; height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; margin-bottom: 6px; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent-gold), var(--accent-green)); border-radius: 4px; transition: width 0.3s; }
.rd-detail { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-muted); }

/* 每日任务 */
.daily-tasks { display: flex; flex-direction: column; gap: 8px; }
.task-item { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-secondary); }
.task-item.completed { color: var(--text-muted); text-decoration: line-through; }
.task-check { font-size: 16px; }
.task-label { flex: 1; }
.task-reward { font-size: 12px; color: var(--accent-gold); white-space: nowrap; }
.daily-bonus { text-align: center; margin-top: 12px; }
.daily-bonus.claimed { text-align: center; margin-top: 12px; font-size: 13px; color: var(--accent-green); }
.streak-info { margin-top: 12px; font-size: 13px; color: var(--text-muted); text-align: center; }
.highlight { color: var(--accent-gold); font-weight: 700; }

/* 可点击统计 */
.stat-box.clickable { cursor: pointer; transition: all 0.2s; position: relative; }
.stat-box.clickable:hover { border-color: var(--accent-gold); transform: translateY(-1px); }
.sb-badge { position: absolute; top: -4px; right: -4px; background: var(--accent-gold); color: #1a1410; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px; min-width: 16px; }

/* 统计历史弹窗 */
.stat-modal-overlay {
  position: fixed; inset: 0; z-index: 3000;
  background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;
  animation: fadeIn 0.2s ease;
}
.stat-modal {
  background: var(--bg-card); border: 1px solid var(--accent-gold); border-radius: 16px;
  width: 90%; max-width: 420px; max-height: 80vh; display: flex; flex-direction: column;
  box-shadow: 0 8px 40px rgba(0,0,0,0.5);
}
.stat-modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid var(--border-color);
  font-family: var(--font-decorative); color: var(--accent-gold); font-size: 16px;
}
.stat-modal-close { background: none; border: none; color: var(--text-muted); font-size: 18px; cursor: pointer; padding: 4px; }
.stat-modal-close:hover { color: var(--accent-red); }
.stat-modal-body { flex: 1; overflow-y: auto; padding: 12px 20px; }
.stat-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border-color); font-size: 13px; }
.stat-item:last-child { border-bottom: none; }
.si-time { color: var(--text-muted); font-size: 11px; min-width: 36px; }
.si-amount { font-weight: 700; min-width: 50px; text-align: right; }
.si-amount.positive { color: var(--accent-green); }
.si-amount.negative { color: var(--accent-red); }
.si-reason { color: var(--text-secondary); flex: 1; }
.stat-empty { text-align: center; color: var(--text-muted); padding: 40px 0; font-size: 14px; }
</style>
