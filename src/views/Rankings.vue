<template>
  <section class="view active">
    <div class="rankings-root">
      <button class="back-btn" @click="store.goTo('profile')">← 返回个人中心</button>
      <h2 class="section-title">🏆 修行排行榜</h2>

      <!-- 排序选项卡 -->
      <div class="rank-tabs">
        <button v-for="s in sortOptions" :key="s.key"
          :class="['rank-tab', { active: sort === s.key }]"
          @click="sort = s.key; loadRankings()">{{ s.label }}</button>
      </div>

      <!-- 排名列表 -->
      <div class="rank-list" v-if="list.length">
        <div v-for="(u, i) in list" :key="u.phone"
          :class="['rank-item', { me: u.phone === store.state.phone }]">
          <div :class="['rank-badge', { gold: i === 0, silver: i === 1, bronze: i === 2 }]">
            {{ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}` }}
          </div>
          <div class="rank-info">
            <div class="rank-name">{{ u.nickname || maskPhone(u.phone) }}</div>
            <div class="rank-stats">
              <span>💰 {{ u.money.toLocaleString() }}</span>
              <span>⭐ {{ u.reputation.toLocaleString() }}</span>
              <span>📊 LV{{ u.clinic_level }}</span>
              <span>📖 {{ u.read_count }}篇</span>
            </div>
          </div>
          <div class="rank-value" v-if="sort === 'reputation'">{{ u.reputation.toLocaleString() }} 声望</div>
          <div class="rank-value" v-else-if="sort === 'clinic_level'">LV{{ u.clinic_level }}</div>
          <div class="rank-value" v-else>{{ u.read_count }} 篇</div>
        </div>
      </div>

      <div v-else-if="loading" class="rank-empty">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      <div v-else class="rank-empty">
        <p>暂无排名数据</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGameStore } from '@/stores/gameStore.js'
import { fetchRankings } from '@/utils/api.js'

const store = useGameStore()
const sort = ref('reputation')
const list = ref([])
const loading = ref(false)

const sortOptions = [
  { key: 'reputation', label: '⭐ 声望榜' },
  { key: 'clinic_level', label: '📊 医馆等级' },
  { key: 'read_count', label: '📖 研读榜' }
]

function maskPhone(phone) {
  if (!phone) return '***'
  return phone.slice(0, 3) + '****' + phone.slice(7)
}

async function loadRankings() {
  loading.value = true
  try {
    list.value = await fetchRankings(sort.value, 50)
  } catch (e) {
    console.error('加载排名失败:', e)
  }
  loading.value = false
}

onMounted(loadRankings)
</script>

<style scoped>
.rankings-root { max-width: 700px; margin: 0 auto; }
.back-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 13px; padding: 4px 0; font-family: var(--font-body); }
.back-btn:hover { color: var(--accent-gold); }
.rank-tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
.rank-tab {
  padding: 8px 16px; border-radius: 20px; border: 1px solid var(--border-color);
  background: var(--bg-secondary); color: var(--text-secondary);
  font-size: 13px; cursor: pointer; transition: all 0.2s;
}
.rank-tab:hover { border-color: var(--accent-gold); }
.rank-tab.active { background: rgba(201,168,76,.12); border-color: var(--accent-gold); color: var(--accent-gold); }

.rank-list { display: flex; flex-direction: column; gap: 8px; }
.rank-item {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px;
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 10px; transition: all 0.2s;
}
.rank-item.me { border-color: var(--accent-gold); background: rgba(201,168,76,.05); }
.rank-badge { font-size: 18px; font-weight: 700; min-width: 44px; text-align: center; color: var(--text-muted); }
.rank-badge.gold, .rank-badge.silver, .rank-badge.bronze { font-size: 24px; }
.rank-info { flex: 1; min-width: 0; }
.rank-name { font-size: 14px; color: var(--text-primary); margin-bottom: 4px; }
.rank-stats { display: flex; gap: 10px; font-size: 11px; color: var(--text-muted); flex-wrap: wrap; }
.rank-value { font-size: 14px; font-weight: 700; color: var(--accent-gold); white-space: nowrap; }
.rank-empty { text-align: center; padding: 40px; color: var(--text-muted); }
.spinner {
  width: 24px; height: 24px; border: 3px solid var(--border-color);
  border-top-color: var(--accent-gold); border-radius: 50%;
  animation: spin 0.8s linear infinite; margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
