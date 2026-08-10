<template>
  <section class="view active">
    <div class="dashboard-root">
      <button class="back-btn" @click="goProfile">← 返回个人中心</button>
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

      <!-- 医馆概况 -->
      <div class="info-card">
        <h3>🏥 医馆经营</h3>
        <div class="clinic-dash-stats">
          <div class="cd-stat"><span>💰</span><strong>{{ state.money.toLocaleString() }}</strong><span>金</span></div>
          <div class="cd-stat"><span>⭐</span><strong>{{ state.reputation.toLocaleString() }}</strong><span>声望</span></div>
          <div class="cd-stat"><span>📊</span><strong>LV{{ state.clinicLevel }}</strong><span>{{ cityName }}</span></div>
        </div>
      </div>

      <!-- 研读进度 -->
      <div class="info-card">
        <h3>📚 研读进度</h3>
        <div class="reading-dash">
          <div class="rd-row"><span>已读</span><strong>{{ readCount }}</strong><span>/ 162 篇</span></div>
          <div class="progress-track"><div class="progress-fill" :style="{width: (readCount/162*100)+'%'}"></div></div>
          <div class="rd-detail"><span>素问 {{ sw.done }}/{{ sw.total }}</span><span>灵枢 {{ ls.done }}/{{ ls.total }}</span></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore.js'

const store = useGameStore()
const { state, readCount, CITIES } = store
const cityName = computed(() => CITIES[state.cityIndex]?.name || '青云村')
const sw = computed(() => {
  const done = state.readChapters.filter(id => id <= 81).length
  return { done, total: 81 }
})
const ls = computed(() => {
  const done = state.readChapters.filter(id => id > 81).length
  return { done, total: 81 }
})

function goProfile() { store.goTo('profile') }
</script>

<style scoped>
.dashboard-root { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
.back-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 13px; padding: 4px 0; text-align: left; font-family: var(--font-body); align-self: flex-start; }
.back-btn:hover { color: var(--accent-gold); }
.info-card {
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 12px; padding: 20px;
}
.info-card h3 { font-family: var(--font-decorative); color: var(--accent-gold); font-size: 16px; margin-bottom: 12px; }
.log-card { max-height: 500px; overflow-y: auto; }
.activity-log { display: flex; flex-direction: column; gap: 6px; }
.log-empty { text-align: center; color: var(--text-muted); padding: 40px 0; }
.log-entry { display: flex; gap: 8px; font-size: 14px; }
.log-time { color: var(--text-muted); white-space: nowrap; font-size: 11px; line-height: 1.8; }
.log-text { color: var(--text-secondary); line-height: 1.8; }
.clinic-dash-stats { display: flex; gap: 16px; flex-wrap: wrap; }
.cd-stat { display: flex; align-items: center; gap: 4px; font-size: 14px; color: var(--text-secondary); }
.cd-stat strong { color: var(--accent-gold); font-size: 16px; }
.reading-dash { }
.rd-row { display: flex; gap: 6px; font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; align-items: baseline; }
.rd-row strong { color: var(--accent-gold); font-size: 20px; }
.progress-track { width: 100%; height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; margin-bottom: 6px; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent-gold), var(--accent-green)); border-radius: 4px; transition: width 0.3s; }
.rd-detail { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); }
</style>
