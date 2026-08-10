/**
 * 游戏状态管理 — 响应式 + 服务端持久化
 * 所有数据通过 API 存储在 data/user-data/ 中
 */
import { reactive, computed } from 'vue'
import { login, tokenLogin, logout as apiLogout, fetchUserData, saveUserData } from '@/utils/api.js'

// ========================================
// 游戏常量（来自 GAME_DATA）
// ========================================
// GAME_DATA 在 data.js 中定义，以 script 标签加载（const 不会挂载到 window）
const GD = (typeof GAME_DATA !== 'undefined' ? GAME_DATA : null) ||
  { chapters: [], herbs: {},
    recipes: [], bosses: [] }

// ========================================
// 医馆常量
// ========================================
const CITIES = [
  { name: '🛖 青云村', baseFee: 10, moveFee: 0 },
  { name: '🏘️ 落霞镇', baseFee: 35, moveFee: 3500 },
  { name: '🏡 清水乡', baseFee: 65, moveFee: 6500 },
  { name: '🏪 白石县', baseFee: 100, moveFee: 10000 },
  { name: '🏫 红枫县', baseFee: 140, moveFee: 14000 },
  { name: '🏬 临川府', baseFee: 185, moveFee: 18500 },
  { name: '🏛️ 江陵府', baseFee: 235, moveFee: 23500 },
  { name: '🏯 云梦府', baseFee: 290, moveFee: 29000 },
  { name: '🏰 金陵城', baseFee: 350, moveFee: 35000 },
  { name: '⛩️ 洛阳城', baseFee: 415, moveFee: 41500 },
  { name: '🗼 长安城', baseFee: 485, moveFee: 48500 },
  { name: '🏙️ 幽州城', baseFee: 560, moveFee: 56000 },
  { name: '🌆 益州城', baseFee: 640, moveFee: 64000 },
  { name: '🏗️ 荆州城', baseFee: 725, moveFee: 72500 },
  { name: '🏢 扬州城', baseFee: 815, moveFee: 81500 },
  { name: '🏬 开封府', baseFee: 910, moveFee: 91000 },
  { name: '🏛️ 紫禁城', baseFee: 1010, moveFee: 101000 },
  { name: '🏥 太医院', baseFee: 1115, moveFee: 111500 }
]
const CITY_LV_REQUIREMENTS = [1, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 95, 100]

const FURNITURE = [
  // 第1层 · 诊区
  { key: 'zhenzhuo', name: '🪑 榆木诊桌', price: 500, effect: '诊金+5%', lv: 1, layer: 1 },
  { key: 'yizheYi', name: '🪑 医者椅', price: 2000, effect: '坐诊心神-1', lv: 3, layer: 1 },

  // 第2层 · 药柜（免费默认拥有）
  { key: 'yaogui', name: '🌿 百草药柜', price: 8000, effect: '药材图鉴展示', lv: 5, layer: 2 },

  // 第3层 · 药区
  { key: 'yaonian', name: '🏺 药碾', price: 100000, effect: '采药全对+10金+1声望', lv: 20, layer: 3 },
  { key: 'yaohu', name: '🍶 药壶', price: 400000, effect: '采药全对+10心神', lv: 38, layer: 3 },
  { key: 'chaju', name: '☕ 青瓷茶具', price: 800000, effect: '每日首诊+20金', lv: 50, layer: 3 },

  // 第4层 · 诊辅
  { key: 'pingfeng', name: '🪟 雕花屏风', price: 50000, effect: '坐诊声望+1/次', lv: 12, layer: 4 },
  { key: 'zhenliaoChuang', name: '🛏️ 诊疗床', price: 200000, effect: '诊金+10%', lv: 25, layer: 4 },
  { key: 'shujia', name: '📚 药典书架', price: 1500000, effect: '研读心神-5', lv: 60, layer: 4 },

  // 第5层 · 陈设
  { key: 'xinglinBian', name: '🖼️ 杏林匾', price: 20000, effect: '诊金+5%', lv: 8, layer: 5 },
  { key: 'yutu', name: '🗺️ 城市舆图', price: 600000, effect: '搬迁费-20%', lv: 45, layer: 5 },
  { key: 'chahua', name: '🌸 瓷瓶插花', price: 1500000, effect: '坐诊声望+2/次', lv: 55, layer: 5 },

  // 第6层 · 门面
  { key: 'denglong', name: '🏮 灯笼', price: 150000, effect: '每日签到心神+10', lv: 30, layer: 6 },
  { key: 'jinbian', name: '🏆 醫聖金匾', price: 3000000, effect: '诊金+10%、声望+10%', lv: 70, layer: 6 },
  { key: 'tongling', name: '🔔 御赐铜铃', price: 30000000, effect: '每日前3次诊金×5', lv: 95, layer: 6 },
  { key: 'pailou', name: '🏛️ 御题牌楼', price: 60000000, effect: '诊金+30%', lv: 100, layer: 6 }
]

// 层收集奖励
const LAYER_BONUSES = [
  { level: 1, keys: ['zhenzhuo', 'yizheYi'], bonus: '诊金+5%', desc: '诊区齐全' },
  { level: 2, keys: ['yaogui'], bonus: '—', desc: '药柜' },
  { level: 3, keys: ['yaonian', 'yaohu', 'chaju'], bonus: '采药全对+20金', desc: '药区齐全' },
  { level: 4, keys: ['pingfeng', 'zhenliaoChuang', 'shujia'], bonus: '坐诊心神-1', desc: '诊辅齐全' },
  { level: 5, keys: ['xinglinBian', 'yutu', 'chahua'], bonus: '每日签到心神+10', desc: '陈设齐全' },
  { level: 6, keys: ['denglong', 'jinbian', 'tongling', 'pailou'], bonus: '诊金+15%', desc: '门面齐全' },
]

// 药材套装增益
const HERB_SET_BONUSES = [
  { chapter: '解表药', count: 29, range: [1,18], bonus: '诊金×1.5' },
  { chapter: '清热药', count: 73, range: [19,54], bonus: '+5声望/题' },
  { chapter: '温里药', count: 11, range: [19,54], bonus: '答错仅扣-2声望' },
  { chapter: '泻下药', count: 14, range: [127,162], bonus: '坐诊心神-1' },
  { chapter: '袪风湿药', count: 34, range: [73,108], bonus: '诊金×1.5' },
  { chapter: '化湿药', count: 8, range: [55,90], bonus: '+3声望/题' },
  { chapter: '利水渗湿药', count: 31, range: [73,108], bonus: '+5%金钱/题' },
  { chapter: '理气药', count: 23, range: [37,72], bonus: '+5%金钱/题' },
  { chapter: '消食药', count: 9, range: [91,126], bonus: '研读心神-2' },
  { chapter: '驱虫药', count: 9, range: [91,126], bonus: '坐诊心神-1' },
  { chapter: '止血药', count: 23, range: [55,90], bonus: '研读后赠3次免心神坐诊' },
  { chapter: '活血化瘀药', count: 33, range: [55,90], bonus: '+10声望/题' },
  { chapter: '化痰止咳平喘药', count: 40, range: [91,126], bonus: '+5%金钱/题' },
  { chapter: '安神药', count: 11, range: [109,126], bonus: '每日心神恢复+5' },
  { chapter: '平肝息风药', count: 17, range: [109,126], bonus: '+10%金钱/题' },
  { chapter: '开窍药', count: 4, range: [145,162], bonus: '研读+50修为/章' },
  { chapter: '补虚药', count: 63, range: [37,72], bonus: '范围内其他增益翻倍' },
  { chapter: '收涩药', count: 22, range: [127,144], bonus: '答错仅扣-1声望' },
  { chapter: '涌吐药', count: 3, range: [145,162], bonus: '坐诊心神-1' },
  { chapter: '攻毒杀虫止痒药', count: 10, range: [145,162], bonus: '+5%金钱/题' },
  { chapter: '拔毒化腐生肌药', count: 6, range: [145,162], bonus: '采药+10心神' }
]

// ========================================
// 响应式状态
// ========================================
const state = reactive({
  // ---- 用户数据（持久化） ----
  phone: '',
  nickname: '',
  nicknameChanged: false,
  playerName: '求道者',
  cultivation: 0,
  mind: 100,
  maxMind: 100,
  readChapters: [],
  quizResults: {},
  herbs: {},
  proverbs: [],
  achievements: {},
  inventory: [],
  currentChapter: null,
  lastLoginDate: null,
  streak: 0,
  dailyTasks: { read: false, quiz: false, login: false, date: null },
  dailyBonusClaimed: false,
  activityLog: [],
  bossDefeated: [],
  totalQuizzesPassed: 0,
  perfectScores: 0,

  // ---- 医馆经营数据（持久化） ----
  money: 0,
  reputation: 0,
  clinicLevel: 1,
  cityIndex: 0,
  furniture: {
    zhenzhuo: false, yizheYi: false,
    yaonian: false, yaohu: false, chaju: false,
    pingfeng: false, zhenliaoChuang: false, shujia: false,
    xinglinBian: false, yutu: false, chahua: false,
    denglong: false, jinbian: false, tongling: false, pailou: false
  },
  herbCollection: {},

  // ---- 统计历史 ----
  statHistory: [],
  token: '',
  dailyConsultCount: 0,
  consultStats: {},       // { chapterId: count }

  // ---- 运行时状态 ----
  loaded: false,
  saving: false,
  savePending: false,
  currentView: 'profile',

  // 测验
  quizChapterId: null,
  quizQuestions: [],
  quizIndex: 0,
  quizScore: 0,
  quizAnswered: false,
  quizSelected: null,

  // Boss战
  bossIndex: null,
  bossHp: 0,
  bossMaxHp: 0,
  bossPhase: 'idle',
  bossSelectedCard: null,

  // 阅读
  richData: null,
  readingLoading: false
})

// ========================================
// 计算属性
// ========================================
const chapters = computed(() => GD.chapters || [])
const allHerbs = computed(() => GD.herbs || {})
const recipes = computed(() => GD.recipes || [])
const bosses = computed(() => GD.bosses || [])

const readCount = computed(() => state.readChapters.length)

const suwenProgress = computed(() => {
  const all = chapters.value.filter(c => c.type === 'suwen')
  const done = all.filter(c => state.readChapters.includes(c.id))
  return { done: done.length, total: all.length }
})
const lingshuProgress = computed(() => {
  const all = chapters.value.filter(c => c.type === 'lingshu')
  const done = all.filter(c => state.readChapters.includes(c.id))
  return { done: done.length, total: all.length }
})

// 当前章节
const currentChapter = computed(() => {
  if (!state.currentChapter) return null
  return chapters.value.find(c => c.id === state.currentChapter) || null
})

// ========================================
// 医馆计算属性
// ========================================
const cityList = computed(() => CITIES)
const cityName = computed(() => CITIES[state.cityIndex]?.name || CITIES[0].name)
const cityBaseFee = computed(() => CITIES[state.cityIndex]?.baseFee || 10)
const cityMoveFee = computed(() => (CITIES[state.cityIndex + 1]?.moveFee || 0))
const clinicMultiplier = computed(() => 1.0 + (state.clinicLevel - 1) * 0.05)
const consultationFee = computed(() => {
  const base = cityBaseFee.value * clinicMultiplier.value * (1 + readCount.value / 20)
  let bonus = 1.0
  if (state.furniture.zhenzhuo) bonus += 0.05
  if (state.furniture.xinglinBian) bonus += 0.05
  if (state.furniture.zhenliaoChuang) bonus += 0.10
  if (state.furniture.jinbian) bonus += 0.10
  if (state.furniture.pailou) bonus += 0.30
  // 层收集奖励
  if (layerCompletions.value[0]?.complete) bonus += 0.05   // 诊区
  if (layerCompletions.value[5]?.complete) bonus += 0.15   // 门面
  if (allFurnitureCollected.value) bonus += 0.20            // 全收集
  return Math.round(base * bonus)
})
const nextLevelCost = computed(() => state.clinicLevel * 100)
const canLevelUp = computed(() => state.reputation >= nextLevelCost.value)
const nextCityLevel = computed(() => {
  for (let i = CITY_LV_REQUIREMENTS.length - 1; i > state.cityIndex; i--) {
    if (state.clinicLevel >= CITY_LV_REQUIREMENTS[i]) return CITY_LV_REQUIREMENTS[i]
  }
  return 999
})
const canRelocate = computed(() => {
  const next = state.cityIndex + 1
  if (next >= CITIES.length) return false
  return state.clinicLevel >= CITY_LV_REQUIREMENTS[next] && state.money >= CITIES[next].moveFee
})
const furnitureList = computed(() => FURNITURE.map(f => ({
  ...f, owned: state.furniture[f.key] || false, unlocked: state.clinicLevel >= f.lv
})))
const furnitureIncome = computed(() => 0)
const layerCompletions = computed(() => {
  return LAYER_BONUSES.map(l => ({
    ...l,
    complete: l.keys.every(k => state.furniture[k])
  }))
})
const allFurnitureCollected = computed(() =>
  FURNITURE.every(f => f.price === 0 || state.furniture[f.key])
)

const herbCollectionCount = computed(() => Object.keys(state.herbCollection).length)
const herbSetProgress = computed(() => {
  const sectionCounts = {}
  for (const herbName of Object.keys(state.herbCollection || {})) {
    const cat = state.herbCollection[herbName]
    if (typeof cat === 'string' && cat) {
      sectionCounts[cat] = (sectionCounts[cat] || 0) + 1
    }
  }
  return HERB_SET_BONUSES.map(set => {
    const collected = sectionCounts[set.chapter] || 0
    return { ...set, collected, complete: collected >= set.count }
  })
})

// ========================================
// 方法
// ========================================
const actions = {
  /** 登录/注册 */
  async login(phone) {
    state.phone = phone
    try {
      const result = await login(phone)
      if (result.data) Object.assign(state, result.data)
      state.phone = phone
      // 兜底：服务端可能不返回 nickname 字段
      if (!state.nickname) state.nickname = ''
      if (state.nicknameChanged === undefined) state.nicknameChanged = false
      if (result.token) localStorage.setItem('qihuang_token', result.token)
      state.loaded = true
      // 每日重置坐诊计数
      if (result.data.dailyTasks?.login && state.statHistory.length === 0) {
        state.dailyConsultCount = 0
      // 灯笼额外心神 + 陈设齐全额外
        let extraMind = 0
        if (state.furniture.denglong) extraMind += 10
        if (layerCompletions.value[4]?.complete) extraMind += 10
        if (extraMind) state.mind = Math.min(state.maxMind, state.mind + extraMind)
        if (state.furniture.denglong) state.mind = Math.min(state.maxMind, state.mind + 10)
        const mindBonus = state.furniture.denglong ? 40 : 30
        state.statHistory.push({ type: 'mind', amount: mindBonus, reason: '每日登录恢复', time: new Date().toLocaleTimeString() })
        state.statHistory.push({ type: 'money', amount: 50, reason: '每日任务-登录', time: new Date().toLocaleTimeString() })
        state.statHistory.push({ type: 'rep', amount: 5, reason: '每日任务-登录', time: new Date().toLocaleTimeString() })
      }
      this.addLog(result.isNew ? '🎉 新道友加入修行' : '🙏 登录签到')
      return result
    } catch (e) {
      console.warn('登录失败:', e)
      state.loaded = true
      throw e
    }
  },

  /** Token 自动登录 */
  async tokenLogin(token) {
    try {
      const result = await tokenLogin(token)
      if (result.data) Object.assign(state, result.data)
      state.phone = result.phone
      if (!state.nickname) state.nickname = ''
      if (state.nicknameChanged === undefined) state.nicknameChanged = false
      state.loaded = true
      return true
    } catch (e) {
      localStorage.removeItem('qihuang_token')
      state.loaded = true
      return false
    }
  },

  /** 修改昵称（仅一次） */
  async changeNickname(nickname) {
    const res = await fetch('/api/user/nickname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: state.phone, nickname })
    })
    const json = await res.json()
    if (json.success) {
      state.nickname = json.nickname
      state.nicknameChanged = true
    }
    return json
  },

  /** 保存到服务端 */
  async save() {
    if (state.saving) {
      state.savePending = true
      return
    }
    state.saving = true
    try {
      await saveUserData({
        phone: state.phone,
        playerName: state.playerName,
        cultivation: state.cultivation,
        mind: state.mind,
        maxMind: state.maxMind,
        readChapters: state.readChapters,
        quizResults: state.quizResults,
        herbs: state.herbs,
        proverbs: state.proverbs,
        achievements: state.achievements,
        inventory: state.inventory,
        currentChapter: state.currentChapter,
        lastLoginDate: state.lastLoginDate,
        streak: state.streak,
        dailyTasks: state.dailyTasks,
        dailyBonusClaimed: state.dailyBonusClaimed,
        activityLog: state.activityLog,
        statHistory: state.statHistory,
        token: state.token,
        bossDefeated: state.bossDefeated,
        totalQuizzesPassed: state.totalQuizzesPassed,
        perfectScores: state.perfectScores,
        money: state.money,
        reputation: state.reputation,
        clinicLevel: state.clinicLevel,
        cityIndex: state.cityIndex,
        furniture: state.furniture,
        herbCollection: state.herbCollection,
        nickname: state.nickname,
        nicknameChanged: state.nicknameChanged,
        dailyConsultCount: state.dailyConsultCount,
        consultStats: state.consultStats
      }, state.phone)
    } catch (e) {
      console.error('保存失败:', e)
    } finally {
      state.saving = false
      if (state.savePending) {
        state.savePending = false
        this.save()
      }
    }
  },

  /** 导航 */
  goTo(view) { state.currentView = view },

  /** 添加修为 */
  addCultivation(amount) {
    state.cultivation += amount
    this.save()
  },

  /** 消耗心神 */
  consumeMind(amount) {
    state.mind = Math.max(0, state.mind - amount)
    this._trackStat('mind', -amount, '研读消耗')
    this.save()
  },

  /** 恢复心神 */
  restoreMind(amount) {
    state.mind = Math.min(state.maxMind, state.mind + amount)
    this._trackStat('mind', amount, '采药奖励')
    this.save()
  },

  hasMind(amount) { return state.mind >= amount },

  /** 标记章节已读 */
  markChapterRead(chapterId) {
    if (!state.readChapters.includes(chapterId)) {
      state.readChapters.push(chapterId)
      state.readChapters.sort((a, b) => a - b)
      this.save()
      return true
    }
    return false
  },

  isChapterRead(chapterId) { return state.readChapters.includes(chapterId) },

  /** 保存测验结果 */
  saveQuizResult(chapterId, score, maxScore, bonus) {
    state.quizResults[chapterId] = { score, maxScore, passed: score >= 2, bonus: bonus || 0, timestamp: Date.now() }
    if (score >= 2) state.totalQuizzesPassed++
    if (score === maxScore) state.perfectScores++
    else state.perfectScores = 0
    this.save()
  },

  /** 药材 */
  addHerb(name, count = 1) {
    state.herbs[name] = (state.herbs[name] || 0) + count
    this.save()
  },
  consumeHerb(name, count = 1) {
    if ((state.herbs[name] || 0) < count) return false
    state.herbs[name] -= count
    if (state.herbs[name] <= 0) delete state.herbs[name]
    this.save()
    return true
  },

  /** 箴言 */
  addProverb(proverb) {
    if (proverb && proverb.text && !state.proverbs.some(p => p.text === proverb.text)) {
      state.proverbs.push(proverb)
      this.save()
      return true
    }
    return false
  },

  /** 统计变动记录 */
  _trackStat(type, amount, reason) {
    const now = new Date()
    const t = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    state.statHistory.unshift({ type, amount, reason, time: t })
    if (state.statHistory.length > 200) state.statHistory.length = 200
  },

  /** 日志 */
  addLog(text) {
    const now = new Date()
    const t = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    state.activityLog.unshift({ time: t, text })
    if (state.activityLog.length > 50) state.activityLog.length = 50
    this.save()
  },

  // ========================================
  // 医馆经营
  // ========================================

  /** 添加金钱 */
  addMoney(amount, reason = '') {
    state.money += amount
    if (reason) this._trackStat('money', amount, reason)
    this.save()
  },

  /** 消耗金钱（返回是否成功） */
  spendMoney(amount, reason = '') {
    if (state.money < amount) return false
    state.money -= amount
    if (reason) this._trackStat('money', -amount, reason)
    this.save()
    return true
  },

  /** 声望 */
  addReputation(amount, reason = '') {
    state.reputation += amount
    if (state.reputation < 0) state.reputation = 0
    if (reason) this._trackStat('rep', amount, reason)
    this.save()
  },

  /** 升级医馆 */
  levelUpClinic() {
    if (state.reputation < nextLevelCost.value || state.clinicLevel >= 100) return false
    state.reputation -= nextLevelCost.value
    state.clinicLevel++
    this._trackStat('rep', -nextLevelCost.value, `医馆升到 LV${state.clinicLevel}`)
    this.addLog(`医馆升到 LV${state.clinicLevel}！`)
    this.save()
    return true
  },

  canLevelUp() { return state.reputation >= nextLevelCost.value && state.clinicLevel < 100 },

  /** 搬迁城市 */
  relocate() {
    const next = state.cityIndex + 1
    if (next >= CITIES.length) return false
    if (state.clinicLevel < CITY_LV_REQUIREMENTS[next]) return false
    const fee = state.furniture.yutu
      ? Math.round(CITIES[next].moveFee * 0.8)
      : CITIES[next].moveFee
    if (!this.spendMoney(fee, `搬迁至 ${CITIES[next].name}`)) return false
    state.cityIndex = next
    this.addLog(`搬迁至 ${CITIES[next].name}！`)
    this.save()
    return true
  },

  /** 购买家具 */
  buyFurniture(key) {
    const f = FURNITURE.find(x => x.key === key)
    if (!f || state.furniture[key] || state.clinicLevel < f.lv) return false
    if (!this.spendMoney(f.price, `购买 ${f.name}`)) return false
    state.furniture[key] = true
    this.addLog(`购入 ${f.name}`)
    this.save()
    return true
  },

  /** 记录药材学习（图鉴） */
  addHerbCollection(name, category) {
    if (!name || state.herbCollection[name]) return false
    // 去除分类名中的空格以匹配 HERB_SET_BONUSES
    const normalized = category ? category.replace(/\s+/g, '') : ''
    state.herbCollection[name] = normalized || true
    this.save()
    return true
  },

  /** 获取挂机收入（已移除） */
  getPassiveIncomeSeconds(seconds) { return 0 },

  /** 坐诊：执行一次并返回结果 */
  doConsultation(chapterId, correct) {
    // 统计
    if (chapterId) {
      state.consultStats[chapterId] = (state.consultStats[chapterId] || 0) + 1
    }
    // 心神消耗（医者椅-1 · 诊辅齐全额外-1）
    let mindCost = 5
    if (state.furniture.yizheYi) mindCost--
    if (layerCompletions.value[3]?.complete) mindCost--
    state.mind = Math.max(0, state.mind - mindCost)
    this._trackStat('mind', -mindCost, '坐诊消耗')

    let fee = consultationFee.value
    // 铜铃：前3次×5
    if (state.furniture.tongling && state.dailyConsultCount < 3) fee *= 5
    // 茶具：每日首次+20金
    if (state.furniture.chaju && state.dailyConsultCount === 0) fee += 20

    if (correct) {
      let rep = (allFurnitureCollected.value ? 12 : 10)
      if (state.furniture.pingfeng) rep += 1
      if (state.furniture.chahua) rep += 2
      if (state.furniture.jinbian) rep = Math.round(rep * 1.1)
      state.reputation += rep
      if (state.reputation < 0) state.reputation = 0
      state.money += fee
      state.dailyConsultCount++
      this._trackStat('rep', rep, '坐诊答对')
      this._trackStat('money', fee, '坐诊收入')
      this.addLog(`坐诊成功 +${fee}金`)
      this.save()
      return { success: true, fee, rep }
    } else {
      state.reputation = Math.max(0, state.reputation - 5)
      state.dailyConsultCount++
      this._trackStat('rep', -5, '坐诊答错')
      this.addLog(`坐诊失败`)
      this.save()
      return { success: false, fee: 0, rep: -5 }
    }
  },

  /** 丹药 */
  addToInventory(item) {
    state.inventory.push({ ...item, obtainedAt: Date.now() })
    this.save()
  },

  // 开始测验
  startQuiz(chapter) {
    if (!chapter || !chapter.quiz) return
    state.quizChapterId = chapter.id
    state.quizQuestions = [...chapter.quiz]
    state.quizIndex = 0
    state.quizScore = 0
    state.quizAnswered = false
    state.quizSelected = null
  },

  // Boss战
  triggerBoss(index) {
    const boss = bosses.value[index]
    if (!boss) return
    state.bossIndex = index
    state.bossHp = boss.hp
    state.bossMaxHp = boss.hp
    state.bossPhase = 'select'
    state.bossSelectedCard = null
  },
  defeatBoss() {
    if (state.bossIndex !== null && !state.bossDefeated.includes(state.bossIndex)) {
      state.bossDefeated.push(state.bossIndex)
      this.addCultivation(200)
      this.addLog(`击败了Boss：${bosses.value[state.bossIndex]?.name}`)
      this.save()
    }
    state.bossIndex = null
    state.bossPhase = 'idle'
  },

  /** 退出登录 */
  async logout() {
    const token = localStorage.getItem('qihuang_token')
    if (token) {
      try { await apiLogout(token) } catch (e) { /* ignore */ }
    }
    localStorage.removeItem('qihuang_token')
    state.phone = ''
    state.loaded = false
  },

  // 重置
  async reset() {
    // 重新加载默认值
    const phone = state.phone
    Object.assign(state, {
      phone,
      playerName: '求道者', cultivation: 0, mind: 100, maxMind: 100,
      readChapters: [], quizResults: {}, herbs: {},
      proverbs: [], achievements: {}, inventory: [], currentChapter: null,
      lastLoginDate: null, streak: 0,
      dailyTasks: { read: false, quiz: false, login: false, date: null },
      activityLog: [], bossDefeated: [], totalQuizzesPassed: 0, perfectScores: 0,
      money: 0, reputation: 0, clinicLevel: 1, cityIndex: 0,
      furniture: Object.keys(state.furniture).reduce((o,k) => ({...o, [k]: false}), {}),
      herbCollection: {}
    })
    await this.save()
  }
}

// ========================================
// 导出
// ========================================
export function useGameStore() {
  return { state, chapters, allHerbs, recipes, bosses,
    readCount, suwenProgress, lingshuProgress,
    currentChapter,
    // 医馆
    cityList, cityName, cityBaseFee, cityMoveFee, clinicMultiplier, consultationFee,
    nextLevelCost, canLevelUp, nextCityLevel, canRelocate,
    furnitureList, furnitureIncome, herbCollectionCount, herbSetProgress,
    layerCompletions, allFurnitureCollected,
    FURNITURE, CITIES, CITY_LV_REQUIREMENTS, HERB_SET_BONUSES,
    ...actions }
}
