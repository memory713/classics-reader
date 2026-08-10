<template>
  <section class="view active">
    <div class="herb-cabinet-root">
      <button class="back-btn" @click="store.goTo('clinic')">← 返回医馆</button>
      <div class="cabinet-header">
        <h2>🌿 百草药柜</h2>
        <p class="cabinet-desc">收集药材解锁永久增益</p>
        <div class="cabinet-progress-ring">
          <svg viewBox="0 0 100 100" class="ring-svg">
            <circle cx="50" cy="50" r="42" class="ring-bg"/>
            <circle cx="50" cy="50" r="42" class="ring-fill"
              :style="{strokeDashoffset: 264 - (herbCount/473*264)}"/>
          </svg>
          <div class="ring-text">
            <span class="ring-count">{{ herbCount }}</span>
            <span class="ring-total">/ 473</span>
          </div>
        </div>
        <div class="cabinet-total-bar">
          <div class="total-bar-fill" :style="{width: (herbCount/473*100)+'%'}"></div>
        </div>
        <div class="cabinet-total-text">总收集 <strong>{{ Math.round(herbCount/473*100) }}%</strong>（{{ herbCount }}/473）</div>
      </div>

      <div class="cabinet-body">
        <div v-for="set in herbSets" :key="set.chapter"
          :class="['cabinet-shelf', { complete: set.isComplete }]"
          @click="showShelfDetail(set)">
          <div class="shelf-top">
            <span class="shelf-icon">{{ set.isComplete ? '🏺' : '🫙' }}</span>
            <span class="shelf-name">{{ set.chapter }}</span>
            <span class="shelf-count">{{ set.collectedCount }}/{{ set.count }}</span>
            <span :class="['shelf-pct', { complete: set.isComplete }]">{{ Math.round(set.collectedCount/set.count*100) }}%</span>
          </div>
          <div class="shelf-jars">
            <span v-for="n in set.count" :key="n"
              :class="['jar', { filled: n <= set.collectedCount, complete: set.isComplete }]"
              :style="n <= set.collectedCount ? { background: jarColors[set.idx % jarColors.length] } : {}">
            </span>
          </div>
          <div class="shelf-bottom">
            <span class="shelf-range">章{{ set.range[0] }}~{{ set.range[1] }}</span>
            <span :class="['shelf-bonus', { active: set.isComplete }]">{{ set.bonus }}</span>
          </div>
          <div v-if="set.isComplete" class="shelf-glow"></div>
        </div>
      </div>

      <div v-if="herbCount >= 473" class="cabinet-all">
        🏆 百草全书 — 诊金×2、声望×2
      </div>
    </div>

    <!-- 分类药材弹窗 -->
    <Teleport to="body">
      <div v-if="shelfModal && shelfModal.herbs" class="shelf-overlay" @click.self="shelfModal = null">
        <div class="shelf-modal">
          <div class="sm-header">
            <span>{{ shelfModal.name }}</span>
            <span class="sm-count">{{ shelfModal.collectedCount }}/{{ shelfModal.count }}</span>
            <button class="sm-close" @click="shelfModal = null">✕</button>
          </div>
          <div class="sm-body">
            <div v-for="h in shelfModal.herbs" :key="h.name" :class="['sm-herb', { owned: h.owned }]">
              <span class="sm-status">{{ h.owned ? '✅' : '⬜' }}</span>
              <span class="sm-name">{{ h.name }}</span>
              <span v-if="h.owned" class="sm-owned">已收集</span>
              <span v-else class="sm-missing">未收集</span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore.js'

const store = useGameStore()
const { state, HERB_SET_BONUSES } = store

const herbCount = computed(() => Object.keys(state.herbCollection).length)

const herbSets = computed(() => {
  if (!HERB_SET_BONUSES || !Array.isArray(HERB_SET_BONUSES)) return []
  const collection = state.herbCollection || {}
  const sectionCounts = {}
  for (const herbName of Object.keys(collection)) {
    const cat = collection[herbName]
    if (typeof cat === 'string' && cat) {
      sectionCounts[cat] = (sectionCounts[cat] || 0) + 1
    }
  }
  return HERB_SET_BONUSES.map((set, i) => {
    const collected = sectionCounts[set.chapter] || 0
    return { ...set, idx: i, collectedCount: collected, isComplete: collected >= set.count }
  })
})

const shelfModal = ref(null)

function showShelfDetail(set) {
  const herbs = Object.entries(state.herbCollection || {})
    .filter(([, cat]) => cat === set.chapter)
    .map(([name]) => ({ name, owned: true }))
  shelfModal.value = { ...set, herbs }
}

const jarColors = [
  '#c9a84c', '#6aaa6a', '#5ba8a8', '#c84c4c', '#a86ac9',
  '#c97a3a', '#4a8ac9', '#8ac96a', '#c96a8a', '#6ac9a8'
]
</script>

<style scoped>
.herb-cabinet-root { max-width: 800px; margin: 0 auto; padding: 0 8px; }
.back-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 13px; padding: 4px 0; font-family: var(--font-body); }
.back-btn:hover { color: var(--accent-gold); }

/* 顶部圆环进度 */
.cabinet-header { text-align: center; margin-bottom: 24px; }
.cabinet-header h2 { font-family: var(--font-decorative); color: var(--accent-gold); font-size: 22px; letter-spacing: 4px; }
.cabinet-desc { font-size: 13px; color: var(--text-muted); margin: 4px 0 16px; }
.cabinet-progress-ring { position: relative; width: 100px; height: 100px; margin: 0 auto; }
.ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-bg { fill: none; stroke: var(--bg-secondary); stroke-width: 6; }
.ring-fill { fill: none; stroke: var(--accent-gold); stroke-width: 6; stroke-linecap: round; stroke-dasharray: 264; transition: stroke-dashoffset 0.8s ease; }
.ring-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.ring-count { font-size: 22px; font-weight: 700; color: var(--accent-gold); line-height: 1; }
.ring-total { font-size: 11px; color: var(--text-muted); }

/* 药柜主体——模拟中药柜 */
.cabinet-body {
  background: linear-gradient(180deg, #2d251e, #3d3228);
  border: 2px solid #5c4a36; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px;
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.3);
}
.cabinet-shelf {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px;
  padding: 10px 12px; position: relative; overflow: hidden; transition: all 0.3s; cursor: pointer;
}
.cabinet-shelf.complete { border-color: var(--accent-gold); background: rgba(201,168,76,0.06); }
.shelf-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.shelf-icon { font-size: 16px; }
.shelf-name { font-size: 13px; color: rgba(255,255,255,0.8); font-weight: 600; flex: 1; }
.shelf-count { font-size: 11px; color: var(--accent-gold); }
.shelf-jars { display: flex; gap: 3px; flex-wrap: wrap; margin-bottom: 6px; }
.jar {
  width: 6px; height: 10px; border-radius: 1px 1px 3px 3px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
  transition: all 0.3s;
}
.jar.filled { border-color: rgba(255,255,255,0.2); box-shadow: 0 0 6px rgba(201,168,76,0.3); }
.jar.complete { box-shadow: 0 0 8px rgba(201,168,76,0.5), 0 0 15px rgba(201,168,76,0.15); }
.shelf-jars { display: flex; gap: 2px; flex-wrap: wrap; margin-bottom: 6px; }
.shelf-bottom { display: flex; justify-content: space-between; font-size: 10px; }
.shelf-range { color: rgba(255,255,255,0.25); }
.shelf-bonus { color: rgba(255,255,255,0.3); transition: all 0.3s; }
.shelf-bonus.active { color: var(--accent-gold); font-weight: 600; }
.shelf-glow {
  position: absolute; inset: 0; border-radius: 8px;
  background: linear-gradient(135deg, rgba(201,168,76,0.1), transparent 60%);
  pointer-events: none; animation: shelfGlow 2s ease-in-out infinite;
}
@keyframes shelfGlow {
  0%, 100% { opacity: 0.3; } 50% { opacity: 1; }
}

.cabinet-all {
  text-align: center; padding: 16px; margin-top: 20px;
  background: linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05));
  border: 2px solid var(--accent-gold); border-radius: 12px;
  font-size: 16px; color: var(--accent-gold); font-weight: 700;
  box-shadow: 0 0 30px rgba(201,168,76,0.2);
  animation: shelfGlow 2s ease-in-out infinite;
}
/* 分类弹窗 */
.shelf-overlay {
  position: fixed; inset: 0; z-index: 3000;
  background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;
  animation: fadeIn 0.2s ease;
}
.shelf-modal {
  background: var(--bg-card); border: 1px solid var(--accent-gold); border-radius: 16px;
  width: 90%; max-width: 420px; max-height: 70vh; display: flex; flex-direction: column;
  box-shadow: 0 8px 40px rgba(0,0,0,0.5);
}
.sm-header {
  display: flex; align-items: center; gap: 8px;
  padding: 16px 20px; border-bottom: 1px solid var(--border-color);
  font-family: var(--font-decorative); color: var(--accent-gold); font-size: 16px;
}
.sm-header .sm-count { font-size: 13px; color: var(--text-muted); font-family: var(--font-body); }
.sm-close { margin-left: auto; background: none; border: none; color: var(--text-muted); font-size: 18px; cursor: pointer; padding: 4px; }
.sm-close:hover { color: var(--accent-red); }
.sm-body { flex: 1; overflow-y: auto; padding: 8px 20px; }
.sm-herb { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--border-color); font-size: 14px; }
.sm-herb:last-child { border-bottom: none; }
.sm-herb.owned { color: var(--text-primary); }
.sm-herb:not(.owned) { color: var(--text-muted); }
.sm-status { font-size: 14px; min-width: 20px; }
.sm-name { flex: 1; }
.sm-owned { font-size: 11px; color: var(--accent-green); }
.sm-missing { font-size: 11px; color: var(--text-muted); }

.shelf-pct { font-size: 11px; color: var(--text-muted); min-width: 32px; text-align: right; }
.shelf-pct.complete { color: var(--accent-gold); font-weight: 700; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.cabinet-total-bar { width: 100%; height: 4px; background: var(--bg-secondary); border-radius: 2px; margin-top: 8px; overflow: hidden; }
.total-bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent-gold), var(--accent-green)); border-radius: 2px; transition: width 0.5s; }
.cabinet-total-text { font-size: 12px; color: var(--text-muted); margin-top: 6px; }
.cabinet-total-text strong { color: var(--accent-gold); }
</style>
