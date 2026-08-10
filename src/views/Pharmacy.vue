<template>
  <section class="view active">
    <div class="pharmacy-header">
      <h2>🌿 药庐</h2>
      <p class="section-desc">收集药性精华，炼制灵丹妙药</p>
    </div>
    <div class="pharmacy-layout">
      <div class="pharmacy-left">
        <h3>药材库存</h3>
        <div class="herb-grid">
          <div v-for="(info, name) in displayHerbs" :key="name"
            :class="['herb-card', { locked: !herbCount(name) }]">
            <div class="herb-icon">{{ info?.icon || '🌿' }}</div>
            <div class="herb-name">{{ name }}</div>
            <div class="herb-count">×{{ herbCount(name) }}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">{{ info?.rarity || '普通' }}</div>
          </div>
        </div>
      </div>
      <div class="pharmacy-right">
        <h3>炼丹炉</h3>
        <div class="alchemy-recipes">
          <div v-for="recipe in recipes" :key="recipe.name" class="recipe-card">
            <div class="recipe-info">
              <div class="recipe-name">{{ recipe.name }}</div>
              <div class="recipe-cost">所需：{{ formatCost(recipe.cost) }}</div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">{{ recipe.desc }}</div>
            </div>
            <button class="recipe-btn" :disabled="!canCraft(recipe)" @click="craft(recipe)">
              炼制
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore.js'

const store = useGameStore()
const { state, allHerbs, recipes } = store

// 合并预设药材 + 用户背包中有的(但预设列表中没有的)药材
const displayHerbs = computed(() => {
  const base = allHerbs.value || {}
  const merged = {}
  // 先放预设药材
  for (const key of Object.keys(base)) {
    merged[key] = base[key]
  }
  // 再放用户拥有的额外药材
  if (state.herbs) {
    for (const herbName of Object.keys(state.herbs)) {
      if (!merged[herbName]) {
        merged[herbName] = { icon: '🌿', desc: '采药获得的药材', rarity: '普通' }
      }
    }
  }
  return merged
})

function herbCount(name) { return state.herbs[name] || 0 }
function formatCost(cost) {
  return Object.entries(cost).map(([h, c]) => `${h}×${c}`).join('、')
}
function canCraft(recipe) {
  return Object.entries(recipe.cost).every(([h, c]) => (state.herbs[h] || 0) >= c)
}
function craft(recipe) {
  if (!canCraft(recipe)) return
  Object.entries(recipe.cost).forEach(([h, c]) => store.consumeHerb(h, c))

  let msg = ''
  switch (recipe.effect) {
    case 'mind': store.restoreMind(recipe.value); msg = `✨ 炼制成功！恢复${recipe.value}点心神值`; break
    case 'cultivation': store.addCultivation(recipe.value); msg = `✨ 炼制成功！获得${recipe.value}点修为`; break
    case 'hint': store.addToInventory({ name: recipe.name, type: 'hint' }); msg = `✨ 炼制成功！获得${recipe.name}`; break
    case 'annotation': store.addToInventory({ name: recipe.name, type: 'annotation' }); msg = `✨ 炼制成功！获得${recipe.name}`; break
  }
  store.addLog(`炼制了${recipe.name}`)
  window.dispatchEvent(new CustomEvent('show-toast', { detail: msg }))
}
</script>
