<template>
  <section class="view active">
    <div class="herb-gathering">
      <div class="gathering-header">
        <div class="gathering-title-area">
          <h2>🌿 采药</h2>
          <p class="section-desc">学习药材知识，全部答对可获得心神、金钱和药材奖励</p>
        </div>
      </div>

      <div class="gathering-body">
        <HerbQuiz ref="quizRef" @restore-mind="onRestoreMind" @reward-herb="onRewardHerb" @complete="onComplete" />
      </div>

      <div class="herb-gallery">
        <h3>📖 已识药材</h3>
        <div class="gallery-grid">
          <div v-for="h in identifiedHerbs" :key="h.name" class="gallery-item">
            <span class="gallery-name">{{ h.name }}</span>
            <span class="gallery-pinyin">{{ h.pinyin }}</span>
            <span class="gallery-section">{{ h.section }}</span>
          </div>
          <div v-if="identifiedHerbs.length === 0" class="gallery-empty">
            采药识药后，这里会记录你认识的药材
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore.js'
import HerbQuiz from '@/components/HerbQuiz.vue'

const store = useGameStore()

const quizRef = ref(null)
const identifiedHerbs = ref([])
const totalCorrect = ref(0)

function onRestoreMind(amount, herbName, herbPinyin, herbSection) {
  // 药碾/药壶 + 药区齐全加成
  const layer3Complete = store.layerCompletions?.[2]?.complete
  const bonusMoney = (state.furniture?.yaonian ? 10 : 0) + (layer3Complete ? 20 : 0)
  const bonusRep = state.furniture?.yaonian ? 1 : 0
  const bonusMind = state.furniture?.yaohu ? 10 : 0

  store.restoreMind(amount + bonusMind)
  store.addMoney(50 + bonusMoney, '采药-答对')
  store.addReputation(5 + bonusRep, '采药-答对')

  // 记录识别的药材
  if (herbName && !identifiedHerbs.value.find(h => h.name === herbName)) {
    identifiedHerbs.value.unshift({
      name: herbName,
      pinyin: herbPinyin || '',
      section: herbSection || '',
      identifiedAt: new Date().toLocaleTimeString()
    })
  }
  totalCorrect.value++
}

function onComplete(score, total) {
  store.addLog(`采药辨药完成：答对 ${score}/${total} 题`)
}

function onRewardHerb(herbName, herbSection, herbCategory) {
  // 如果药材不在 GAME_DATA.herbs 中，自动创建条目
  const GD = typeof GAME_DATA !== 'undefined' ? GAME_DATA : null
  if (GD && !GD.herbs[herbName]) {
    GD.herbs[herbName] = {
      icon: '🌿',
      desc: '采药获得的药材',
      rarity: '普通'
    }
  }
  store.addHerb(herbName)
  store.addHerbCollection(herbName, herbCategory)
  store.addLog(`采药获得药材：${herbName}`)
  // 额外金钱奖励
  store.addMoney(200, '采药-全对')
  store.addReputation(20, '采药-全对')
}
</script>

<style scoped>
.herb-gathering {
  max-width: 800px;
  margin: 0 auto;
}

.gathering-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.gathering-title-area h2 {
  font-family: var(--font-decorative);
  color: var(--accent-gold);
  font-size: 24px;
  letter-spacing: 4px;
}

.gathering-stats {
  display: flex;
  gap: 10px;
}

.stat-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 13px;
  color: var(--text-secondary);
}

.chip-value {
  color: var(--accent-gold);
  font-weight: 700;
  font-size: 16px;
}

.gathering-body {
  margin-bottom: 24px;
}

.herb-gallery {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}

.herb-gallery h3 {
  font-family: var(--font-decorative);
  color: var(--accent-gold);
  font-size: 17px;
  letter-spacing: 2px;
  margin-bottom: 12px;
}

.gallery-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.gallery-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 13px;
}

.gallery-name {
  color: var(--accent-gold);
  font-weight: 600;
}

.gallery-pinyin {
  color: var(--text-muted);
  font-size: 11px;
}

.gallery-section {
  color: var(--text-secondary);
  font-size: 11px;
  padding: 1px 6px;
  background: rgba(201,168,76,0.08);
  border-radius: 8px;
}

.gallery-empty {
  width: 100%;
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}
</style>
