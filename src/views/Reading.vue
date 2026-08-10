<template>
  <section class="view active">
    <!-- 操作按钮（放在文章上面） -->
    <div v-if="currentChapter" class="reading-actions">
      <template v-if="isRead(state.currentChapter)">
        <span class="read-badge" v-if="getQuizPerfect(state.currentChapter)">
          ✅ 已读（答对3/3。已获得金币{{ getQuizBonus(state.currentChapter) }}）
        </span>
        <span v-else class="read-badge partial" @click="retakeQuiz">
          ✅ 已读（答对2/3）重新答题
        </span>
      </template>
      <template v-else-if="canQuiz">
        <button class="btn btn-primary" @click="startQuiz">📝 开始小测</button>
      </template>
      <template v-else>
        <div class="mind-warning">
          <span class="mind-warning-icon">😰</span>
          <span>心神不足（当前 {{ state.mind }}/{{ state.maxMind }}），阅读后无法进行小测。</span>
          <span class="mind-warning-hint">每日会自动恢复，或去采药补充心神。</span>
        </div>
      </template>
    </div>

    <!-- 阅读内容 -->
    <div class="reading-content" ref="contentRef">
      <!-- 当前章节导航 -->
      <div v-if="currentChapter" class="chapter-nav-inline">
        <button class="btn btn-sm btn-secondary" @click="prevChapter" :disabled="!currentChapter">◀</button>
        <span class="chapter-title-display">
          <span :class="['chapter-type', currentChapter.type]">{{ currentChapter.volume }}</span>
          第{{ currentChapter.number }}篇 · {{ currentChapter.name }}
        </span>
        <button class="btn btn-sm btn-secondary" @click="nextChapter" :disabled="!currentChapter">▶</button>
        <button class="btn btn-sm btn-secondary" @click="showChapterList = !showChapterList">📖</button>
      </div>
      <!-- 章节列表 -->
      <div v-if="showChapterList" class="chapter-list-panel">
        <div class="chapter-list-header">
          <span>📖 章节列表</span>
          <button class="btn btn-sm btn-secondary" @click="showChapterList = false">✕</button>
        </div>
        <div class="chapter-list-tabs">
          <button v-for="tab in ['素问','灵枢']" :key="tab"
            :class="['chapter-list-tab', { active: chapterListTab === tab }]"
            @click="chapterListTab = tab">{{ tab }}</button>
        </div>
        <div class="chapter-list-scroll">
          <div v-for="ch in filteredChapterList" :key="ch.id"
            :class="['chapter-list-item', {
              active: state.currentChapter === ch.id,
              read: isRead(ch.id)
            }]"
            @click="pickChapter(ch.id)">
            <span class="cli-status">{{ isRead(ch.id) ? '✅' : '📖' }}</span>
            <span class="cli-num">{{ ch.number }}</span>
            <span class="cli-name">{{ ch.name }}</span>
          </div>
        </div>
      </div>
      <div v-if="!currentChapter" class="reading-placeholder">
        <div class="placeholder-icon">📜</div>
        <p>选择一篇经文开始研读</p>
        <p class="placeholder-sub">每读完一章，将进行课后小测</p>
        <button class="btn btn-primary" @click="showChapterList = true" style="margin-top:16px">📖 选择章节</button>
      </div>
      <div v-else-if="loading" class="reading-loading">
        <div class="spinner"></div><span>加载中...</span>
      </div>
      <template v-else>
        <!-- 心神不足提示条 -->
        <div v-if="!isRead(state.currentChapter) && !store.hasMind(state.furniture?.shujia ? 5 : 10)" class="mind-banner">
          <span>💡 心神不足（{{ state.mind }}/{{ state.maxMind }}），可阅读本文但无法进行小测。明日登录自动恢复，或去采药补充心神。</span>
        </div>
        <!-- 模式选项卡 -->
        <div class="reading-mode-tabs">
          <button v-for="m in modes" :key="m.key"
            :class="['reading-mode-tab', { active: activeMode === m.key }]"
            @click="activeMode = m.key">{{ m.icon }} {{ m.label }}</button>
        </div>
        <!-- 对照（原文+译文左右并排） -->
        <div v-show="activeMode === 'sidebyside'" class="rich-side-by-side">
          <div class="side-original" v-html="renderedOriginal"></div>
          <div class="side-translation" v-html="renderedTranslation"></div>
        </div>
        <!-- 解析（左右对照：原文引文 + 解析内容） -->
        <div v-show="activeMode === 'analysis'" class="rich-analysis">
          <div v-for="(item, i) in analysisItems" :key="i" class="analysis-pair">
            <div class="analysis-quote">{{ item.title }}</div>
            <div class="analysis-explanation"><p>{{ item.content }}</p></div>
          </div>
        </div>
      </template>
    </div>

    <!-- 回到顶部按钮 -->
    <div v-if="showBackTop" class="back-top" @click="scrollToTop">⬆</div>

    <!-- 测验面板（动态嵌入） -->
    <div v-if="quizActive" class="inline-quiz-panel">
      <template v-if="!quizFinished">
        <div class="quiz-header">
          <h3>课后小测</h3>
          <span class="quiz-progress">{{ state.quizIndex + 1 }}/{{ state.quizQuestions.length }}</span>
        </div>
        <div class="quiz-question">{{ currentQuestion?.q }}</div>
        <div class="quiz-options">
          <div v-for="(opt, idx) in currentQuestion?.options" :key="idx"
            :class="['quiz-option', {
              selected: quizAnswers[state.quizIndex]?.selected === idx && !quizAnswers[state.quizIndex]?.submitted,
              correct: quizAnswers[state.quizIndex]?.submitted && idx === currentQuestion?.answer,
              wrong: quizAnswers[state.quizIndex]?.submitted && quizAnswers[state.quizIndex]?.selected === idx && idx !== currentQuestion?.answer
            }]"
            @click="selectAndSubmit(idx)">
            {{ String.fromCharCode(65 + idx) }}. {{ opt }}
          </div>
        </div>
        <div v-if="quizAnswers[state.quizIndex]?.submitted" :class="['quiz-result', quizAnswers[state.quizIndex]?.selected === currentQuestion?.answer ? 'correct' : 'wrong']">
          {{ quizAnswers[state.quizIndex]?.selected === currentQuestion?.answer ? '✅ 回答正确！' : '❌ 回答错误。正确答案是：' + String.fromCharCode(65 + currentQuestion.answer) + '. ' + currentQuestion.options[currentQuestion.answer] }}
        </div>
        <div class="quiz-actions">
          <button class="btn btn-secondary" @click="prevQuizQuestion" :disabled="state.quizIndex === 0">上一题</button>
          <button class="btn btn-primary" @click="nextQuizQuestion">{{ state.quizIndex < state.quizQuestions.length - 1 ? '下一题' : '查看结果' }}</button>
        </div>
      </template>
      <template v-else>
        <div class="quiz-finished">
          <div class="quiz-finished-icon">{{ quizPassed ? '🎉' : '💪' }}</div>
          <div class="quiz-finished-title">{{ quizPassed ? '测验通过！' : '还差一点！' }}</div>
          <div class="quiz-finished-score">得分 {{ state.quizScore }}/{{ state.quizQuestions.length }}</div>
          <div v-if="state.quizScore === state.quizQuestions.length" class="quiz-finished-reward">
            💰 全对奖励：{{ 100 * (state.readChapters.length) }} 金
          </div>
          <div class="quiz-finished-actions">
            <button v-if="state.quizScore < state.quizQuestions.length" class="btn btn-primary" @click="restartQuiz">重新答题</button>
            <button class="btn btn-secondary" @click="quizActive = false">关闭</button>
          </div>
        </div>
      </template>
    </div>

    <!-- 脉象模拟器（sw18专用） -->
    <div v-if="showPulseSimulator" class="pulse-section">
      <PulseSimulator />
    </div>

    <!-- 脚注弹窗 -->
    <Teleport to="body">
      <div v-if="footnote" class="footnote-tooltip show" :style="fnStyle"
        @click.stop v-html="footnote"></div>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useGameStore } from '@/stores/gameStore.js'
import { loadChapterData, renderOriginalWithFootnotes, renderTranslation, renderFootnoteContent } from '@/utils/data-loader.js'
import PulseSimulator from '@/components/PulseSimulator.vue'

const store = useGameStore()
const { state, chapters, currentChapter } = store

// 研读进度
const readCount = computed(() => state.readChapters.length)

const contentRef = ref(null)
const activeMode = ref('sidebyside')
const loading = ref(false)
const richData = ref(null)
const analysisItems = ref([])
const footnote = ref('')
const fnStyle = ref({})
const showBackTop = ref(false)
const showChapterList = ref(false)
const chapterListTab = ref('素问')

// 章节列表
const filteredChapterList = computed(() =>
  (chapters.value || []).filter(c => c.volume === chapterListTab.value)
)

function pickChapter(id) {
  selectChapter(id)
  showChapterList.value = false
}

// 回到顶部
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function onScroll() {
  showBackTop.value = window.scrollY > 600
}

const modes = [
  { key: 'sidebyside', icon: '📑', label: '对照' },
  { key: 'analysis', icon: '🔍', label: '解析' }
]

const isRead = (id) => state.readChapters.includes(id)

// 答题成绩辅助
function getQuizPerfect(chapterId) {
  const r = state.quizResults[chapterId]
  return r && r.score === r.maxScore
}
function getQuizBonus(chapterId) {
  const r = state.quizResults[chapterId]
  return r ? (r.bonus || 0) : 0
}
function retakeQuiz() {
  const ch = currentChapter.value
  if (!ch?.quiz) return
  store.startQuiz(ch)
  quizActive.value = true
  quizFinished.value = false
  quizPassed.value = false
  state.quizScore = 0
  state.quizIndex = 0
  initQuizAnswers()
}

// 选择章节
async function selectChapter(id) {
  const ch = chapters.value.find(c => c.id === id)
  if (!ch) return
  state.currentChapter = id
  activeMode.value = 'sidebyside'
  analysisItems.value = []
  richData.value = null
  quizActive.value = false

  if (ch.hasDetailedData) {
    await loadRichContent(ch)
  }
}

async function loadRichContent(chapter) {
  loading.value = true
  const num = chapter.number
  const data = await loadChapterData(num, chapter.type)
  richData.value = data
  loading.value = false

  if (data && data.sections) {
    // 构建解析条目
    const items = []
    data.sections.forEach(s => {
      if (s.analysis) {
        s.analysis.forEach(a => items.push({ title: a[0], content: a[1] }))
      }
    })
    analysisItems.value = items
  }

  // 脉象模拟器（sw18）
  if (data && data.id === 'sw18') {
    showPulseSimulator.value = true
  } else {
    showPulseSimulator.value = false
  }
}

// 渲染内容
const renderedOriginal = computed(() => {
  if (!richData.value?.sections) return ''
  return richData.value.sections.map(s =>
    renderOriginalWithFootnotes(s.original, s.footnotes)
  ).join('')
})

const renderedTranslation = computed(() => {
  if (!richData.value?.sections) return ''
  return richData.value.sections.map(s =>
    renderTranslation(s.translation)
  ).join('')
})

// 脚注点击
function handleContentClick(e) {
  const ref = e.target.closest('.footnote-ref')
  if (ref) {
    const word = ref.dataset.fnWord || ''
    const content = ref.dataset.fnContent || ''
    const rendered = renderFootnoteContent(content)
    footnote.value = `<div class="fn-word">${word}</div><div class="fn-body">${rendered}</div>`

    const rect = ref.getBoundingClientRect()
    fnStyle.value = {
      left: Math.min(rect.left, window.innerWidth - 320) + 'px',
      top: (rect.bottom + 8) + 'px'
    }
    return
  }
  // 点击其他地方关闭脚注
  if (!e.target.closest('.footnote-tooltip')) {
    footnote.value = ''
  }
}

// 上一篇/下一篇（同卷内切换）
function prevChapter() {
  const cur = state.currentChapter
  if (!cur) return
  const curCh = chapters.value.find(c => c.id === cur)
  if (!curCh) return
  const sameVol = chapters.value.filter(c => c.volume === curCh.volume)
  const idx = sameVol.findIndex(c => c.id === cur)
  if (idx > 0) selectChapter(sameVol[idx - 1].id)
}
function nextChapter() {
  const cur = state.currentChapter
  if (!cur) return
  const curCh = chapters.value.find(c => c.id === cur)
  if (!curCh) return
  const sameVol = chapters.value.filter(c => c.volume === curCh.volume)
  const idx = sameVol.findIndex(c => c.id === cur)
  if (idx < sameVol.length - 1) selectChapter(sameVol[idx + 1].id)
}

// ===== 测验 =====
const quizActive = ref(false)
const quizFinished = ref(false)
const quizPassed = ref(false)
const quizAnswers = ref([])
const readMindCost = computed(() => state.furniture?.shujia ? 5 : 10)
const canQuiz = computed(() => store.hasMind(readMindCost.value))
const currentQuestion = computed(() => {
  return state.quizQuestions[state.quizIndex] || null
})

function initQuizAnswers() {
  quizAnswers.value = state.quizQuestions.map(() => ({ selected: null, submitted: false }))
}

function startQuiz() {
  const ch = currentChapter.value
  if (!ch?.quiz) return
  // 消耗心神（书架减半）
  const mindCost = state.furniture?.shujia ? 5 : 10
  if (!isRead(ch.id) && store.hasMind(mindCost)) store.consumeMind(mindCost)
  store.startQuiz(ch)
  quizActive.value = true
  quizFinished.value = false
  quizPassed.value = false
  state.quizScore = 0
  state.quizIndex = 0
  initQuizAnswers()
  nextTick(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }))
}

function restartQuiz() {
  const ch = currentChapter.value
  if (!ch?.quiz) return
  store.startQuiz(ch)
  quizFinished.value = false
  quizPassed.value = false
  state.quizScore = 0
  state.quizIndex = 0
  initQuizAnswers()
}

function selectAndSubmit(idx) {
  const a = quizAnswers.value[state.quizIndex]
  if (!a || a.submitted) return
  a.selected = idx
  a.submitted = true
  if (idx === currentQuestion.value.answer) state.quizScore++
  // 自动跳转到下一题
  setTimeout(() => {
    if (state.quizIndex < state.quizQuestions.length - 1) {
      state.quizIndex++
    } else {
      finishQuiz()
    }
  }, 800)
}

function prevQuizQuestion() {
  if (state.quizIndex > 0) state.quizIndex--
}

function nextQuizQuestion() {
  if (state.quizIndex < state.quizQuestions.length - 1) {
    state.quizIndex++
  } else {
    finishQuiz()
  }
}

function finishQuiz() {
  const ch = currentChapter.value
  const total = state.quizQuestions.length
  const score = state.quizScore
  const allCorrect = score === total
  const passed = score >= 2

  quizFinished.value = true
  quizPassed.value = passed

  if (allCorrect) {
    const bonus = 100 * (state.readChapters.length + 1)
    store.saveQuizResult(ch.id, score, total, bonus)
    store.markChapterRead(ch.id)

    if (!state.dailyTasks.read) { state.dailyTasks.read = true; store.addMoney(100, '每日任务-研读'); store.addReputation(10, '每日任务-研读') }
    if (!state.dailyTasks.quiz) { state.dailyTasks.quiz = true; store.addMoney(80, '每日任务-小测'); store.addReputation(8, '每日任务-小测') }

    store.addMoney(bonus, '全对奖励')

    if (ch.herbs?.length) {
      const herb = ch.herbs[Math.floor(Math.random() * ch.herbs.length)]
      store.addHerb(herb)
    }
    if (ch.proverb?.text) store.addProverb(ch.proverb)

    store.addLog(`🎉 全对通过《${ch.volume}${ch.number}·${ch.name}》，奖励${bonus}金`)
    store.save()
  } else if (passed) {
    store.saveQuizResult(ch.id, score, total, 0)
    store.markChapterRead(ch.id)
    if (!state.dailyTasks.read) { state.dailyTasks.read = true; store.addMoney(100, '每日任务-研读'); store.addReputation(10, '每日任务-研读') }
    if (!state.dailyTasks.quiz) { state.dailyTasks.quiz = true; store.addMoney(80, '每日任务-小测'); store.addReputation(8, '每日任务-小测') }
    store.addLog(`完成《${ch.volume}${ch.number}·${ch.name}》小测，得分${score}/${total}`)
    store.save()
  } else {
    store.saveQuizResult(ch.id, score, total, 0)
    store.consumeMind(5)
    store.addLog(`《${ch.volume}${ch.number}·${ch.name}》小测未通过（${score}/${total}）`)
  }

  window.dispatchEvent(new CustomEvent('show-toast', {
    detail: allCorrect ? `🎉 满分通过！奖励 ${100 * (state.readChapters.length)} 金` :
            passed ? `✅ 小测通过！得分 ${score}/${total}` :
            `😅 小测未通过，得分 ${score}/${total}`
  }))
}

// ===== 脉象模拟器 =====
const showPulseSimulator = ref(false)

onMounted(() => {
  document.addEventListener('click', handleContentClick)
  window.addEventListener('scroll', onScroll)
  // 每次进入研读，跳转到第一篇未读章节
  const suwen = (chapters.value || []).filter(c => c.volume === '素问')
  const lingshu = (chapters.value || []).filter(c => c.volume === '灵枢')
  const nextSuwen = suwen.find(c => !state.readChapters.includes(c.id))
  const nextLs = lingshu.find(c => !state.readChapters.includes(c.id))
  const target = nextSuwen || nextLs
  selectChapter(target ? target.id : chapters.value[0]?.id || 1)
})

onUnmounted(() => {
  document.removeEventListener('click', handleContentClick)
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.quiz-finished { text-align: center; padding: 20px 0; }
.quiz-finished-icon { font-size: 48px; margin-bottom: 8px; }
.quiz-finished-title { font-family: var(--font-decorative); font-size: 22px; color: var(--accent-gold); letter-spacing: 3px; margin-bottom: 8px; }
.quiz-finished-score { font-size: 16px; color: var(--text-primary); margin-bottom: 4px; }
.quiz-finished-reward { font-size: 14px; color: var(--accent-gold); font-weight: 700; margin-bottom: 16px; }
.quiz-finished-actions { display: flex; justify-content: center; gap: 12px; }
.inline-quiz-panel {
  background: var(--bg-card); border: 1px solid var(--accent-gold); border-radius: 12px;
  padding: 28px; margin-top: 20px; animation: fadeIn 0.3s ease;
}
.inline-quiz-panel .quiz-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
}
.inline-quiz-panel .quiz-header h3 {
  font-family: var(--font-decorative); color: var(--accent-gold); font-size: 20px; letter-spacing: 2px;
}
.inline-quiz-panel .quiz-progress { color: var(--accent-gold); font-weight: 700; font-size: 16px; }
.pulse-section { margin-top: 20px; }

/* 章节行内导航 */
.chapter-nav-inline {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 16px; padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}
.chapter-title-display {
  flex: 1; text-align: center; font-size: 16px;
  font-family: var(--font-decorative); color: var(--accent-gold);
  letter-spacing: 1px;
}
.chapter-nav-inline .btn-sm { font-size: 16px; padding: 4px 14px; }

/* 已读标记 */
.read-badge {
  display: inline-block; padding: 8px 20px; border-radius: 8px;
  background: rgba(106,170,106,.1); border: 1px solid var(--accent-green);
  color: var(--accent-green); font-size: 14px;
}
.read-badge.partial {
  cursor: pointer; border-color: var(--accent-gold);
  color: var(--accent-gold); background: rgba(201,168,76,.1);
}
.read-badge.partial:hover { background: rgba(201,168,76,.2); }

/* 回到顶部 */
.back-top {
  position: fixed; bottom: 80px; right: 20px; z-index: 999;
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--accent-gold); color: #1a1410;
  font-size: 18px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; box-shadow: 0 2px 12px rgba(0,0,0,0.4);
  transition: all 0.3s; animation: fadeIn 0.3s ease;
}
.back-top:hover { transform: scale(1.1); background: var(--accent-gold-light); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* 章节列表 */
.chapter-list-panel {
  background: var(--bg-card); border: 1px solid var(--accent-gold); border-radius: 12px;
  margin-bottom: 16px; overflow: hidden; animation: fadeIn 0.2s ease;
}
.chapter-list-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; border-bottom: 1px solid var(--border-color);
  font-family: var(--font-decorative); color: var(--accent-gold); font-size: 15px;
}
.chapter-list-tabs { display: flex; border-bottom: 1px solid var(--border-color); }
.chapter-list-tab {
  flex: 1; padding: 8px; text-align: center; cursor: pointer;
  background: var(--bg-secondary); color: var(--text-muted); font-size: 13px; border: none;
}
.chapter-list-tab.active { background: var(--bg-card); color: var(--accent-gold); font-weight: 700; }
.chapter-list-scroll { max-height: 50vh; overflow-y: auto; }
.chapter-list-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; cursor: pointer; border-bottom: 1px solid var(--border-color);
  font-size: 14px; color: var(--text-secondary); transition: background 0.15s;
}
.chapter-list-item:hover { background: rgba(201,168,76,0.06); }
.chapter-list-item.active { background: rgba(201,168,76,0.1); color: var(--accent-gold); }
.chapter-list-item.read { color: var(--text-muted); }
.chapter-list-item .cli-status { min-width: 20px; font-size: 12px; }
.chapter-list-item .cli-num { min-width: 28px; color: var(--text-muted); font-size: 12px; }
.chapter-list-item .cli-name { flex: 1; }
</style>
