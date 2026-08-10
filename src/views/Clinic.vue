<template>
  <section class="view active">
    <div class="clinic-root">
      <!-- 顶部状态 -->
      <div class="clinic-header">
        <div class="clinic-title-area">
          <h2>🏥 {{ cityName }} · {{ clinicName }}</h2>
        </div>
        <div class="clinic-stats">
          <div class="stat-badge gold">💰 {{ state.money.toLocaleString() }} 金</div>
          <div class="stat-badge rep">⭐ {{ state.reputation.toLocaleString() }} 声望</div>
          <div class="stat-badge lv">📊 LV{{ state.clinicLevel }}</div>
        </div>
      </div>

      <div class="clinic-body">
        <div class="clinic-left">
          <div class="panel consultation-panel">
            <h3>🩺 坐诊</h3>
            <p class="panel-desc">病人自述内经原文，选对译文即治愈</p>
            <div class="fee-info">
              <span>诊金：</span><strong>{{ store.consultationFee }} 金/次</strong>
              <button class="fee-toggle" @click="showFeeDetail = !showFeeDetail">{{ showFeeDetail ? '收起' : '明细 ▸' }}</button>
              <div v-if="showFeeDetail" class="fee-breakdown">
                <div class="fb-row">城市基础诊金：<strong>{{ cityBaseFee }}</strong></div>
                <div class="fb-row">医馆倍率：<strong>×{{ store.clinicMultiplier.toFixed(2) }}</strong>（LV{{ state.clinicLevel }}）</div>
                <div class="fb-row">研读加成：<strong>×{{ readBonus.toFixed(2) }}</strong>（已读 {{ store.readCount }} 篇，+{{ (store.readCount/20*100).toFixed(0) }}%）</div>
                <div class="fb-row fb-sub">基础 × 倍率 × 研读 = {{ cityBaseFee }} × {{ store.clinicMultiplier.toFixed(2) }} × {{ readBonus.toFixed(2) }} = <strong>{{ Math.round(feeBase) }}</strong></div>
                <div class="fb-divider"></div>
                <div v-for="b in activeBonuses" :key="b.key" class="fb-row">• {{ b.label }}：<strong>+{{ b.pct }}%</strong></div>
                <div v-if="activeBonuses.length === 0" class="fb-row fb-none">（无家具加成）</div>
                <div class="fb-row fb-total">合计加成倍率：<strong>{{ feeBonus.toFixed(2) }}×</strong></div>
                <div class="fb-row fb-total">最终诊金 = {{ Math.round(feeBase) }} × {{ feeBonus.toFixed(2) }} = <strong>{{ store.consultationFee }}</strong></div>
              </div>
              <span class="fee-detail">（已读{{ store.readCount }}篇 · {{ cityName }} ×{{ store.clinicMultiplier.toFixed(2) }}）</span>
            </div>

            <template v-if="!consultActive">
              <button class="btn btn-primary btn-lg" @click="startConsult" :disabled="!store.hasMind(consultMindCost)">
                {{ store.hasMind(consultMindCost) ? '开始接诊' : '心神不足' }}
              </button>
              <p class="hint">
                消耗 {{ consultMindCost }} 心神 / 次
                <button class="fee-toggle" @click="showMindDetail = !showMindDetail">{{ showMindDetail ? '收起' : '明细 ▸' }}</button>
              </p>
              <div v-if="showMindDetail" class="fee-breakdown">
                <div class="fb-row">基础消耗：<strong>5</strong> 心神</div>
                <div class="fb-row" v-if="state.furniture.yizheYi">• 医者椅：<strong>-1</strong></div>
                <div class="fb-row" v-if="store.layerCompletions?.[3]?.complete">• 诊辅齐全：<strong>-1</strong></div>
                <div class="fb-row fb-total">当前消耗 = <strong>{{ consultMindCost }}</strong> 心神</div>
              </div>
            </template>

            <template v-else-if="consultActive && !consultDone">
              <div class="quiz-question">
                <span class="quiz-label">病人自述</span>
                <div class="quiz-text">{{ currentQuestion.text }}</div>
              </div>
              <div class="quiz-options">
                <div v-for="(opt, idx) in currentQuestion.options" :key="idx"
                  :class="['quiz-opt', {
                    correct: consultDone && idx === currentQuestion.answer,
                    wrong: consultDone && consultSelected === idx && idx !== currentQuestion.answer,
                    selected: consultSelected === idx && !consultDone
                  }]"
                  @click="selectAnswer(idx)">
                  {{ opt }}
                </div>
              </div>
              <div v-if="consultDone" :class="['quiz-result', consultCorrect ? 'success' : 'fail']">
                {{ consultCorrect ? '✅ 诊断正确！' : '❌ 诊断错误' }}
              </div>
            </template>

            <template v-else-if="consultDone">
              <div :class="['quiz-result big', consultCorrect ? 'success' : 'fail']">
                <template v-if="consultCorrect">
                  <div class="result-icon">✅</div>
                  <div class="result-text">诊断正确！</div>
                  <div class="result-reward">💰 +{{ lastFee }} 金 · ⭐ +{{ lastRep }} 声望</div>
                </template>
                <template v-else>
                  <div class="result-icon">❌</div>
                  <div class="result-text">诊断错误</div>
                </template>
              </div>
              <button class="btn btn-primary" @click="startConsult">继续接诊</button>
            </template>
          </div>

          <div class="panel">
            <h3>📊 医馆升级</h3>
            <div class="upgrade-bar">
              <div class="upgrade-fill" :style="{width: upgradePercent + '%'}"></div>
            </div>
            <div class="upgrade-info">
              <span>⭐ {{ state.reputation }} / {{ store.nextLevelCost }} 声望</span>
              <span>→ LV{{ state.clinicLevel + 1 }} (倍率×{{ (store.clinicMultiplier + 0.05).toFixed(2) }})</span>
            </div>
            <button class="btn btn-primary" @click="doLevelUp" :disabled="!store.canLevelUp">
              升级 (消耗 {{ store.nextLevelCost }} 声望)
            </button>
          </div>

          <div class="panel" v-if="state.cityIndex < 17">
            <h3>🚛 搬迁城市</h3>
            <p>目标：{{ nextCityName }} · 基础诊金 {{ nextCityFee }} 金</p>
            <p>搬迁费：{{ store.cityMoveFee.toLocaleString() }} 金 · 需要 LV{{ nextCityLv }}</p>
            <button class="btn btn-secondary" @click="doRelocate" :disabled="!store.canRelocate">
              {{ store.canRelocate ? '立即搬迁' : '条件不足' }}
            </button>
          </div>
        </div>

        <div class="clinic-right">
          <div class="panel room-panel">
            <div class="room-view" :style="roomBgStyle">
              <div v-for="l in roomLayers" :key="l.level" class="room-floor" :style="l.style">
                <div class="floor-label">{{ l.label }}</div>
                <div class="floor-items">
                  <div v-for="f in l.items" :key="f.key"
                    :class="['room-item', { owned: f.owned, locked: !f.unlocked, 'cabinet': f.key === 'yaogui', 'just-bought': recentBuy.has(f.key) }]"
                    @click="f.key === 'yaogui' ? store.goTo('achievements') : null">
                    <div v-if="recentBuy.has(f.key)" class="buy-float">{{ f.effect }}</div>
                    <div class="ri-icon">{{ f.owned ? f.name.split(' ')[0] : (f.unlocked ? '🛒' : '🔒') }}</div>
                    <div class="ri-name">{{ f.owned ? f.name.split(' ').slice(1).join(' ') : (f.unlocked ? f.name.split(' ').slice(1).join(' ') : 'LV'+f.lv) }}</div>
                    <div v-if="f.owned && f.effect" class="ri-effect">{{ f.effect }}</div>
                    <div v-if="!f.owned && f.unlocked" class="ri-buy">
                      <span class="ri-price">💰{{ f.price.toLocaleString() }}</span>
                      <button class="btn btn-xs btn-primary" @click.stop="buyFurniture(f.key)" :disabled="state.money < f.price">
                        {{ state.money >= f.price ? '购买' : '金不足' }}
                      </button>
                    </div>
                  </div>
                </div>
                <div v-if="l.complete && l.level !== 2" class="floor-done">✅ 本层齐全</div>
              </div>
            </div>
          </div>

          <div class="panel">
            <h3>📋 坐诊统计</h3>
            <div v-if="Object.keys(state.consultStats || {}).length > 0" class="consult-stats">
              <div v-for="(count, chId) in topConsultStats" :key="chId" class="cs-row">
                <span class="cs-chapter">{{ getChapterName(chId) }}</span>
                <span class="cs-bar"><span class="cs-fill" :style="{width: count/topMax*100+'%'}"></span></span>
                <span class="cs-count">{{ count }}次</span>
              </div>
            </div>
            <div v-else class="consult-empty">完成坐诊后在此显示各章节出题次数</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useGameStore } from '@/stores/gameStore.js'

const store = reactive(useGameStore())
const { state } = store

const consultActive = ref(false)
const consultDone = ref(false)
const consultSelected = ref(null)
const consultCorrect = ref(false)
const currentQuestion = ref({ text: '', options: [], answer: -1, chapterId: -1 })
const lastFee = ref(0)
const lastRep = ref(0)

const showFeeDetail = ref(false)
const showMindDetail = ref(false)

const cityThemes = [
  { bg: '#2d251e', wall: '#4a3d2e', floor: '#5c4a36', roof: '#3d3228', label: '竹木茅草' },
  { bg: '#2a2824', wall: '#4a4238', floor: '#6b5b4f', roof: '#3d3830', label: '青瓦木梁' },
  { bg: '#1e2d28', wall: '#3d4a42', floor: '#5c6b5f', roof: '#303d38', label: '雕梁画栋' },
  { bg: '#2d1e1e', wall: '#4a3838', floor: '#6b5c4a', roof: '#3d3030', label: '红墙金瓦' },
  { bg: '#1e1e2d', wall: '#38384a', floor: '#5c5c6b', roof: '#30303d', label: '皇家气派' },
]
const roomBgStyle = computed(() => {
  const t = cityThemes[Math.min(state.cityIndex, cityThemes.length - 1)] || cityThemes[0]
  return { background: `linear-gradient(180deg, ${t.roof} 0%, ${t.wall} 40%, ${t.floor} 100%)` }
})

const layoutDef = [
  { level: 1, label: '🪑 诊区', keys: ['zhenzhuo', 'yizheYi'], style: 'min-height:90px' },
  { level: 2, label: '🌿 药柜', style: 'min-height:120px' },
  { level: 3, label: '🏺 药区', keys: ['yaonian', 'yaohu', 'chaju'], style: 'min-height:80px' },
  { level: 4, label: '🛏️ 诊辅', keys: ['pingfeng', 'zhenliaoChuang', 'shujia'], style: 'min-height:80px' },
  { level: 5, label: '🖼️ 陈设', keys: ['xinglinBian', 'yutu', 'chahua'], style: 'min-height:70px' },
  { level: 6, label: '🏮 门面', keys: ['denglong', 'jinbian', 'tongling', 'pailou'], style: 'min-height:70px' },
]
const roomLayers = computed(() => {
  const fur = state.furniture
  const lv = state.clinicLevel
  const lc = store.layerCompletions || []
  return layoutDef.map(l => {
    const lcItem = lc.find(x => x.level === l.level)
    const complete = lcItem?.complete || false
    if (l.level === 2) {
      const def = store.FURNITURE.find(f => f.key === 'yaogui')
      return { ...l, items: [{ ...def, owned: fur.yaogui, unlocked: true, effect: '点击查看药材图鉴' }], complete: fur.yaogui }
    }
    return {
      ...l,
      items: (l.keys || []).map(k => {
        const def = store.FURNITURE.find(f => f.key === k)
        if (!def) return null
        return { ...def, owned: fur[k] || false, unlocked: lv >= def.lv }
      }).filter(Boolean),
      complete
    }
  })
})

const recentBuy = reactive(new Set())
function buyFurniture(key) {
  if (store.buyFurniture(key)) {
    const f = store.FURNITURE.find(x => x.key === key)
    recentBuy.add(key)
    setTimeout(() => recentBuy.delete(key), 1200)
    window.dispatchEvent(new CustomEvent('show-firework', { detail: `✅ 购入 ${f.name}！` }))
  }
}

const cityName = computed(() => store.CITIES[state.cityIndex]?.name || '青云村')
const clinicName = computed(() => state.clinicLevel >= 50 ? '岐黄大医馆' : state.clinicLevel >= 20 ? '岐黄医馆' : '岐黄小医馆')
const nextCityName = computed(() => { const next = state.cityIndex + 1; return next < store.CITIES.length ? store.CITIES[next].name : '—' })
const nextCityFee = computed(() => { const next = state.cityIndex + 1; return next < store.CITIES.length ? store.CITIES[next].baseFee : 0 })
const nextCityLv = computed(() => { const next = state.cityIndex + 1; return next < store.CITY_LV_REQUIREMENTS.length ? store.CITY_LV_REQUIREMENTS[next] : 999 })
const upgradePercent = computed(() => { const cost = store.nextLevelCost; if (!cost || cost <= 0) return 0; return Math.min(100, Math.round(state.reputation / cost * 100)) })

const cityBaseFee = computed(() => store.CITIES[state.cityIndex]?.baseFee || 10)
const readBonus = computed(() => 1 + store.readCount / 20)
const feeBase = computed(() => cityBaseFee.value * store.clinicMultiplier * readBonus.value)
const feeBonus = computed(() => {
  let b = 1.0
  if (state.furniture.zhenzhuo) b += 0.05
  if (state.furniture.xinglinBian) b += 0.05
  if (state.furniture.zhenliaoChuang) b += 0.10
  if (state.furniture.jinbian) b += 0.10
  if (state.furniture.pailou) b += 0.30
  if (store.layerCompletions?.[0]?.complete) b += 0.05
  if (store.layerCompletions?.[5]?.complete) b += 0.15
  if (store.allFurnitureCollected) b += 0.20
  return b
})
const activeBonuses = computed(() => {
  const list = []
  if (state.furniture.zhenzhuo) list.push({ key: 'zhenzhuo', label: '榆木诊桌', pct: 5 })
  if (state.furniture.xinglinBian) list.push({ key: 'xinglinBian', label: '杏林匾', pct: 5 })
  if (state.furniture.zhenliaoChuang) list.push({ key: 'zhenliaoChuang', label: '诊疗床', pct: 10 })
  if (state.furniture.jinbian) list.push({ key: 'jinbian', label: '醫聖金匾', pct: 10 })
  if (state.furniture.pailou) list.push({ key: 'pailou', label: '御题牌楼', pct: 30 })
  if (store.layerCompletions?.[0]?.complete) list.push({ key: 'layer1', label: '诊区齐全', pct: 5 })
  if (store.layerCompletions?.[5]?.complete) list.push({ key: 'layer6', label: '门面齐全', pct: 15 })
  if (store.allFurnitureCollected) list.push({ key: 'all', label: '全收集', pct: 20 })
  return list
})

const consultMindCost = computed(() => {
  let cost = 5
  if (state.furniture.yizheYi) cost--
  if (store.layerCompletions?.[3]?.complete) cost--
  return Math.max(1, cost)
})

const chapterMap = computed(() => {
  const map = {}
  for (const c of (store.chapters || [])) { map[c.id] = `${c.volume}${c.number}·${c.name}` }
  return map
})
const topConsultStats = computed(() => {
  const stats = { ...(state.consultStats || {}) }
  return Object.fromEntries(
    Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 10)
  )
})
const topMax = computed(() => {
  const vals = Object.values(state.consultStats || {})
  return vals.length > 0 ? Math.max(...vals) : 1
})
function getChapterName(id) { return chapterMap.value[id] || `第${id}章` }

async function startConsult() {
  if (!store.hasMind(consultMindCost.value)) return
  const read = state.readChapters
  if (read.length === 0) {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: '请先研读至少一章' }))
    return
  }
  try {
    const res = await fetch(`/api/consultation?chapters=${read.join(',')}`)
    const data = await res.json()
    if (data.success) {
      currentQuestion.value = data.question
      consultActive.value = true
      consultDone.value = false
      consultSelected.value = null
    }
  } catch (e) { console.error('获取坐诊题目失败:', e) }
}

function selectAnswer(idx) {
  if (consultDone.value) return
  consultSelected.value = idx
  consultDone.value = true
  consultCorrect.value = idx === currentQuestion.value.answer
  const result = store.doConsultation(currentQuestion.value.chapterId, consultCorrect.value)
  lastFee.value = result.fee
  lastRep.value = result.rep
}

function doLevelUp() {
  if (store.levelUpClinic()) {
    window.dispatchEvent(new CustomEvent('show-firework', { detail: `🎉 医馆升到 LV${state.clinicLevel}！` }))
  }
}

function doRelocate() {
  if (store.relocate()) {
    window.dispatchEvent(new CustomEvent('show-firework', { detail: `🚛 搬迁至 ${store.CITIES[state.cityIndex].name}！` }))
  }
}
</script>

<style scoped>
.clinic-root { max-width: 1000px; margin: 0 auto; }
.clinic-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.clinic-title-area h2 { font-family: var(--font-decorative); color: var(--accent-gold); font-size: 24px; }
.clinic-stats { display: flex; gap: 10px; }
.stat-badge { padding: 6px 14px; border-radius: 20px; font-size: 14px; font-weight: 700; }
.stat-badge.gold { background: rgba(201,168,76,.12); border: 1px solid var(--accent-gold); color: var(--accent-gold); }
.stat-badge.rep { background: rgba(106,170,106,.12); border: 1px solid var(--accent-green); color: var(--accent-green); }
.stat-badge.lv { background: rgba(91,168,168,.12); border: 1px solid var(--accent-cyan); color: var(--accent-cyan); }
.clinic-body { display: flex; gap: 20px; flex-wrap: wrap; }
.clinic-left { flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 16px; }
.clinic-right { flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 16px; }
.panel { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; }
.panel h3 { font-family: var(--font-decorative); color: var(--accent-gold); font-size: 16px; margin-bottom: 8px; }
.panel-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }

.fee-info { font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; }
.fee-info strong { color: var(--accent-gold); font-size: 16px; }
.fee-detail { display: block; font-size: 11px; color: var(--text-muted); margin-top: 4px; }
.fee-toggle { background: none; border: none; color: var(--accent-gold); cursor: pointer; font-size: 12px; margin-left: 8px; padding: 2px 6px; border-radius: 4px; font-family: var(--font-body); }
.fee-toggle:hover { background: rgba(201,168,76,0.1); }
.fee-breakdown { margin-top: 8px; padding: 12px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color); }
.fee-breakdown .fb-row { font-size: 12px; color: var(--text-muted); line-height: 1.8; }
.fee-breakdown .fb-row strong { color: var(--accent-gold); }
.fee-breakdown .fb-row.fb-sub { color: var(--text-secondary); margin-bottom: 4px; }
.fee-breakdown .fb-row.fb-total { color: var(--text-primary); margin-top: 2px; }
.fee-breakdown .fb-row.fb-none { font-style: italic; }
.fee-breakdown .fb-divider { height: 1px; background: var(--border-color); margin: 6px 0; }

.btn-lg { padding: 14px 32px; font-size: 16px; }
.hint { font-size: 12px; color: var(--text-muted); margin-top: 8px; }

.quiz-question { margin-bottom: 16px; }
.quiz-label { font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 6px; }
.quiz-text { font-size: 15px; color: var(--text-primary); line-height: 1.8; padding: 12px 16px; background: var(--bg-secondary); border-radius: 8px; border-left: 3px solid var(--accent-gold); white-space: pre-line; }
.quiz-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.quiz-opt { padding: 10px 14px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 14px; color: var(--text-secondary); transition: all .2s; line-height: 1.7; word-break: break-word; }
.quiz-opt:hover { border-color: var(--accent-gold); }
.quiz-opt.selected { border-color: var(--accent-gold); background: rgba(201,168,76,.08); color: var(--accent-gold); }
.quiz-opt.correct { border-color: var(--accent-green); background: rgba(106,170,106,.08); color: var(--accent-green); }
.quiz-opt.wrong { border-color: var(--accent-red); background: rgba(200,76,76,.08); color: var(--accent-red); }
.quiz-result { padding: 12px 16px; border-radius: 8px; font-size: 14px; margin-bottom: 12px; text-align: center; }
.quiz-result.success { background: rgba(106,170,106,.08); border: 1px solid var(--accent-green); color: var(--accent-green); }
.quiz-result.fail { background: rgba(200,76,76,.08); border: 1px solid var(--accent-red); color: var(--accent-red); }
.quiz-result.big { padding: 24px; }
.quiz-result .result-icon { font-size: 36px; }
.quiz-result .result-text { font-size: 18px; font-weight: 700; margin: 8px 0; }
.quiz-result .result-reward { font-size: 16px; color: var(--accent-gold); }

.upgrade-bar { width: 100%; height: 8px; background: var(--bg-secondary); border-radius: 4px; margin-bottom: 8px; overflow: hidden; }
.upgrade-fill { height: 100%; background: linear-gradient(90deg, var(--accent-gold), var(--accent-green)); border-radius: 4px; transition: width .3s; }
.upgrade-info { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }

.room-view { border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; min-height: 400px; border: 2px solid var(--border-color); }
.room-floor { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); }
.room-floor:last-child { border-bottom: none; }
.floor-label { font-size: 10px; color: rgba(255,255,255,0.35); margin-bottom: 6px; letter-spacing: 1px; }
.floor-items { display: flex; gap: 8px; flex-wrap: wrap; }
.room-item { flex: 1; min-width: 90px; padding: 8px 6px; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); text-align: center; transition: all 0.2s; }
.room-item.owned { cursor: default; background: linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05)); border-color: var(--accent-gold); box-shadow: 0 0 12px rgba(201,168,76,0.15); }
.room-item.owned .ri-icon { font-size: 26px; filter: drop-shadow(0 0 4px rgba(201,168,76,0.3)); }
.room-item.owned .ri-name { color: var(--accent-gold); font-size: 11px; font-weight: 600; }
.room-item.owned .ri-effect { opacity: 1; font-size: 10px; }
.room-item.locked { opacity: 0.35; cursor: default; }
.room-item:not(.owned):not(.locked) { cursor: pointer; }
.room-item:not(.owned):not(.locked):hover { background: rgba(255,255,255,0.12); }
.room-item.cabinet { background: linear-gradient(135deg, #c9a84c22, #c9a84c11); border-color: var(--accent-gold); cursor: pointer; min-height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 30px rgba(201,168,76,0.3), inset 0 0 40px rgba(201,168,76,0.08); animation: cabinetBreath 2s ease-in-out infinite; }
.room-item.cabinet .ri-icon { font-size: 34px; filter: drop-shadow(0 0 12px rgba(201,168,76,0.6)); }
.room-item.cabinet .ri-name { color: var(--accent-gold); font-size: 12px; font-weight: 700; }
.room-item.cabinet .ri-effect { opacity: 1; color: var(--accent-gold); font-size: 10px; }
.room-item.cabinet:hover { background: linear-gradient(135deg, #c9a84c33, #c9a84c18); box-shadow: 0 0 50px rgba(201,168,76,0.5), inset 0 0 60px rgba(201,168,76,0.12); }
@keyframes cabinetBreath { 0%, 100% { box-shadow: 0 0 30px rgba(201,168,76,0.3), inset 0 0 40px rgba(201,168,76,0.08); } 50% { box-shadow: 0 0 60px rgba(201,168,76,0.5), inset 0 0 60px rgba(201,168,76,0.15); } }
.ri-icon { font-size: 22px; line-height: 1.2; color: rgba(255,255,255,0.7); }
.ri-name { font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 2px; }
.ri-effect { font-size: 9px; color: var(--accent-gold); margin-top: 1px; opacity: 0.7; }
.ri-buy { margin-top: 6px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.ri-price { font-size: 11px; color: var(--accent-gold); font-weight: 700; }
.btn-xs { padding: 3px 10px; font-size: 11px; }

.room-item.just-bought { animation: boughtPulse 1.2s ease-out; border-color: var(--accent-gold) !important; box-shadow: 0 0 30px rgba(201,168,76,0.5); position: relative; }
@keyframes boughtPulse { 0% { transform: scale(1); background: rgba(201,168,76,0.35); } 25% { transform: scale(1.1); background: rgba(201,168,76,0.25); } 50% { transform: scale(1); background: rgba(201,168,76,0.15); } 100% { background: rgba(255,255,255,0.06); } }
.buy-float { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 11px; color: var(--accent-gold); font-weight: 700; white-space: nowrap; animation: floatUp 1.5s ease-out forwards; pointer-events: none; z-index: 10; }
@keyframes floatUp { 0% { opacity: 1; transform: translateX(-50%) translateY(0); } 100% { opacity: 0; transform: translateX(-50%) translateY(-30px); } }
.floor-done { text-align: center; font-size: 10px; color: var(--accent-gold); margin-top: 4px; animation: fadeIn 0.5s ease; }
.floor-done::before { content: '✦ '; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.consult-stats { display: flex; flex-direction: column; gap: 6px; }
.cs-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.cs-chapter { color: var(--text-muted); min-width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cs-bar { flex: 1; height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden; }
.cs-fill { display: block; height: 100%; background: var(--accent-gold); border-radius: 3px; transition: width 0.5s; }
.cs-count { color: var(--accent-gold); font-weight: 700; min-width: 36px; text-align: right; }
.consult-empty { text-align: center; font-size: 13px; color: var(--text-muted); padding: 16px 0; }
</style>
