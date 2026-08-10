<template>
  <div class="herb-quiz">
    <div v-if="loading" class="herb-quiz-loading">
      <div class="spinner"></div><span>正在入山采药...</span>
    </div>

    <div v-else-if="phase === 'study'" class="study-phase">
      <div class="study-card">
        <div class="study-header">
          <span class="study-name">{{ card.name }}</span>
          <span class="study-pinyin">{{ card.pinyin }}</span>
        </div>
        <div class="study-section">{{ card.section }} · {{ card.category }}</div>
        <div v-if="card.overview" class="study-row"><span class="study-label">概述</span><span>{{ card.overview }}</span></div>
        <div class="study-row"><span class="study-label">药性</span><span>{{ card.property }}</span></div>
        <div class="study-row"><span class="study-label">功效</span><span>{{ card.effect }}</span></div>
        <div class="study-row"><span class="study-label">用法</span><span>{{ card.usage }}</span></div>
        <div v-if="card.caution" class="study-row caution"><span class="study-label">注意</span><span>{{ card.caution }}</span></div>
        <div v-if="card.application" class="study-row"><span class="study-label">应用</span><span>{{ card.application }}</span></div>
        <div v-if="card.ancient" class="study-row ancient"><span class="study-label">古籍</span><span>{{ card.ancient }}</span></div>
        <div v-if="card.modern" class="study-row modern"><span class="study-label">现代研究</span><span>{{ card.modern }}</span></div>
      </div>
      <p class="study-hint">记住上面的信息，接下来要回答 3 道关于这味药的题目，全部答对可获得奖励！</p>
      <div class="study-actions">
        <button class="btn btn-primary" @click="phase='quiz'">开始答题</button>
        <button class="btn btn-secondary" @click="loadCard">下一味药材</button>
      </div>
    </div>

    <div v-else-if="phase === 'quiz'" class="quiz-phase">
      <div class="herb-quiz-header">
        <h3>🌿 辨药：{{ card.name }}</h3>
        <span class="herb-quiz-reward">全部答对获得奖励</span>
      </div>
      <div class="herb-quiz-progress">
        <div class="progress-bar"><div class="progress-fill" :style="{width:(currentIndex/questions.length*100)+'%'}"></div></div>
        <span class="progress-text">{{ currentIndex+1 }}/{{ questions.length }}</span>
      </div>
      <div class="herb-question">{{ currentQuestion.question }}</div>
      <div class="herb-options">
        <div v-for="(opt, idx) in currentQuestion.options" :key="idx"
          :class="['herb-option', {
            selected: answers[currentIndex]?.selected===idx && !answers[currentIndex]?.answered,
            correct: answers[currentIndex]?.answered && idx===currentQuestion.answer,
            wrong: answers[currentIndex]?.answered && answers[currentIndex]?.selected===idx && idx!==currentQuestion.answer
          }]"
          @click="selectAndSubmit(idx)">{{ opt }}</div>
      </div>
      <div v-if="answers[currentIndex]?.answered" :class="['herb-feedback', answers[currentIndex]?.selected===currentQuestion.answer?'correct':'wrong']">
        {{ answers[currentIndex]?.selected===currentQuestion.answer ? '✅ 正确！' : '❌ 回答错误，正确答案是：' + currentQuestion.options[currentQuestion.answer] }}
      </div>
      <div class="herb-quiz-actions">
        <button class="btn btn-secondary" @click="prevQuestion" :disabled="currentIndex===0">上一题</button>
        <button class="btn btn-primary" @click="nextQuestion">{{ currentIndex<questions.length-1 ? '下一题' : '查看结果' }}</button>
      </div>
    </div>

    <div v-else class="result-phase">
      <div class="result-icon">{{ allCorrect ? '🎉' : '💪' }}</div>
      <div class="result-title">{{ allCorrect ? '全对！这味药你记住了！' : '还差一点点！' }}</div>
      <div class="result-score">答对 {{ score }}/{{ questions.length }} 题</div>
      <template v-if="allCorrect">
        <div class="result-rewards">
          <div class="reward-chip">❤️ 心神 +50</div>
          <div class="reward-chip">🌿 获得药材：{{ rewardHerb }}</div>
        </div>
      </template>
      <div v-else class="result-encourage">再试一次，全部答对就能获得奖励！</div>
      <div class="study-actions">
        <button class="btn btn-primary" @click="restartQuiz">重新答题</button>
        <button class="btn btn-secondary" @click="loadCard">下一味药材</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
const emit = defineEmits(['restore-mind', 'reward-herb', 'complete'])
const loading = ref(false); const phase = ref('study')
const card = ref({}); const questions = ref([]); const rewardHerb = ref('')
const currentIndex = ref(0); const score = ref(0)
const answers = ref([])
const currentQuestion = computed(() => questions.value[currentIndex.value] || {})
const allCorrect = computed(() => score.value === questions.value.length)

function initAnswers() {
  answers.value = questions.value.map(() => ({ selected: null, answered: false }))
}

async function loadCard() {
  loading.value = true; phase.value = 'study'; score.value = 0
  currentIndex.value = 0
  try {
    const res = await fetch('/api/herb-card')
    const json = await res.json()
    if (json.success) {
      card.value = json.card; questions.value = json.questions
      rewardHerb.value = json.rewardHerb
      initAnswers()
    }
  } catch (e) { console.error('加载药材失败:', e) }
  loading.value = false
}

function selectAndSubmit(idx) {
  const a = answers.value[currentIndex.value]
  if (!a || a.answered) return
  a.selected = idx
  a.answered = true
  if (idx === currentQuestion.value.answer) score.value++
  // 自动跳转到下一题（短暂延迟让用户看到反馈）
  setTimeout(() => {
    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++
    } else {
      phase.value = 'result'
      if (allCorrect.value) {
        emit('restore-mind', 50, card.value.name, card.value.pinyin, card.value.section)
        emit('reward-herb', rewardHerb.value, card.value.section, card.value.category)
      }
      emit('complete', score.value, questions.value.length)
    }
  }, 800)
}

function prevQuestion() {
  if (currentIndex.value > 0) currentIndex.value--
}

function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
  } else {
    phase.value = 'result'
    if (allCorrect.value) {
      emit('restore-mind', 50, card.value.name, card.value.pinyin, card.value.section)
        emit('reward-herb', rewardHerb.value, card.value.section, card.value.category)
    }
    emit('complete', score.value, questions.value.length)
  }
}

function restartQuiz() {
  phase.value = 'study'
  score.value = 0
  currentIndex.value = 0
  initAnswers()
}

onMounted(loadCard)
</script>

<style scoped>
.herb-quiz-loading{display:flex;align-items:center;justify-content:center;gap:12px;padding:60px;color:var(--text-muted)}
.herb-quiz-loading .spinner{width:20px;height:20px;border:2px solid var(--border-color);border-top-color:var(--accent-gold);border-radius:50%;animation:spin .8s linear infinite}
.study-phase{text-align:center}
.study-badge{display:inline-block;padding:4px 16px;margin-bottom:16px;background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.25);border-radius:16px;font-size:13px;color:var(--accent-gold)}
.study-card{background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:12px;padding:24px;text-align:left;margin-bottom:16px}
.study-header{display:flex;align-items:baseline;gap:12px;margin-bottom:4px}
.study-name{font-size:22px;color:var(--accent-gold);font-weight:700}
.study-pinyin{font-size:14px;color:var(--text-muted)}
.study-section{font-size:12px;color:var(--accent-cyan);margin-bottom:16px;padding:2px 10px;background:rgba(91,168,168,.1);border-radius:8px;display:inline-block}
.study-source{font-size:12px;color:var(--text-muted);margin-left:auto}
.study-label{font-size:12px;color:var(--text-muted);font-weight:600;min-width:44px;flex-shrink:0}
.study-row{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid rgba(74,58,40,.25);font-size:14px;color:var(--text-secondary);line-height:1.7;white-space:pre-line}
.study-row:last-of-type{border-bottom:none}
.study-row.caution .study-label{color:#c84c4c}
.study-row.ancient .study-label{color:var(--accent-gold)}
.study-row.modern .study-label{color:var(--accent-cyan)}
.study-hint{font-size:13px;color:var(--text-muted);margin-bottom:16px}
.study-actions{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}
.herb-quiz-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.herb-quiz-header h3{font-family:var(--font-decorative);color:var(--accent-gold);font-size:18px;letter-spacing:2px}
.herb-quiz-reward{font-size:12px;color:var(--accent-green);padding:4px 10px;background:rgba(106,170,106,.1);border-radius:12px}
.herb-quiz-progress{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.herb-quiz-progress .progress-bar{flex:1}
.progress-text{font-size:13px;color:var(--text-muted);min-width:32px;text-align:right}
.herb-question{font-size:16px;color:var(--text-primary);line-height:1.8;margin-bottom:20px;padding:12px 16px;background:var(--bg-secondary);border-radius:8px;border-left:3px solid var(--accent-gold)}
.herb-options{display:flex;flex-direction:column;gap:10px;margin-bottom:16px}
.herb-option{padding:12px 18px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:8px;cursor:pointer;font-size:15px;color:var(--text-secondary);transition:all .2s ease}
.herb-option:hover{border-color:var(--accent-gold)}
.herb-option.selected{border-color:var(--accent-gold);background:rgba(201,168,76,.1);color:var(--accent-gold)}
.herb-option.correct{border-color:var(--accent-green);background:rgba(106,170,106,.1);color:var(--accent-green)}
.herb-option.wrong{border-color:var(--accent-red);background:rgba(200,76,76,.1);color:var(--accent-red)}
.herb-feedback{padding:12px 16px;border-radius:8px;font-size:14px;line-height:1.6;margin-bottom:16px}
.herb-feedback.correct{background:rgba(106,170,106,.08);border:1px solid var(--accent-green);color:var(--accent-green)}
.herb-feedback.wrong{background:rgba(200,76,76,.08);border:1px solid var(--accent-red);color:var(--accent-red)}
.herb-quiz-actions{display:flex;justify-content:center;gap:12px}
.result-phase{text-align:center;padding:20px 0}
.result-icon{font-size:48px;margin-bottom:8px}
.result-title{font-family:var(--font-decorative);font-size:22px;color:var(--accent-gold);letter-spacing:3px;margin-bottom:8px}
.result-score{font-size:16px;color:var(--text-primary);margin-bottom:12px}
.result-rewards{display:flex;justify-content:center;gap:12px;margin-bottom:16px}
.reward-chip{padding:8px 18px;background:rgba(106,170,106,.1);border:1px solid var(--accent-green);border-radius:20px;font-size:14px;color:var(--accent-green)}
.result-encourage{font-size:14px;color:var(--text-muted);margin-bottom:16px}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
