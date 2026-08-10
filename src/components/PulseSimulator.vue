<template>
  <div class="pulse-simulator">
    <h3>💓 脉象模拟器</h3>
    <div class="pulse-canvas-wrap">
      <canvas ref="canvasRef"></canvas>
    </div>
    <div class="pulse-controls">
      <button v-for="(pt, key) in PULSE_TYPES" :key="key"
        :class="['pulse-btn', { active: currentType === key }]"
        @click="switchType(key)">
        {{ pt.label }}<span class="pulse-rate">{{ pt.rate }}</span>
      </button>
    </div>
    <div class="pulse-info">
      <div class="pulse-status">{{ currentInfo.status }}</div>
      <div class="pulse-desc">{{ currentInfo.desc }}</div>
      <div class="pulse-quote">{{ currentInfo.quote }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
const currentType = ref('normal')
let animId = null

const PULSE_TYPES = {
  normal: { label: '平脉', rate: '一息五至', status: '平人 · 正常脉象',
    desc: '一呼一吸之间脉搏五至，从容和缓，节律均匀。', quote: '"人一呼脉再动，一吸脉亦再动，呼吸定息脉五动"',
    freq: 1.0, amp: 1.0, rhythm: 'regular', color: '#c9a84c' },
  slow: { label: '少气脉', rate: '一息二至', status: '少气 · 气虚脉象',
    desc: '一息仅二至，脉率过慢，阳气不足、鼓动无力。', quote: '"人一呼脉一动，一吸脉一动，曰少气"',
    freq: 0.4, amp: 0.7, rhythm: 'regular', color: '#ff6b6b' },
  rapid: { label: '躁脉', rate: '一息六至', status: '躁脉 · 热病脉象',
    desc: '一息六至，脉来躁动不安。兼尺肤发热为温病。', quote: '"人一呼脉三动，一吸脉三动而躁，尺热曰病温"',
    freq: 1.8, amp: 1.3, rhythm: 'regular', color: '#ff4444' },
  irregular: { label: '乍疏乍数', rate: '忽快忽慢', status: '死脉 · 阴阳离决',
    desc: '脉搏忽慢忽快、毫无规律。脏气紊乱已极。', quote: '"乍疏乍数曰死"',
    freq: 0.5, amp: 0.5, rhythm: 'irregular', color: '#cc3333' },
  stopping: { label: '脉绝不至', rate: '脉来即断', status: '死脉 · 脏气衰绝',
    desc: '脉搏来即断、不再复至。脏气衰绝。', quote: '"脉绝不至曰死"',
    freq: 0.3, amp: 0.3, rhythm: 'stopping', color: '#aa2222' }
}

const currentInfo = computed(() => PULSE_TYPES[currentType.value])

function switchType(key) { currentType.value = key }

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.parentElement.getBoundingClientRect()
  const w = rect.width - 16
  const h = 120
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'
  ctx.scale(dpr, dpr)

  const pt = PULSE_TYPES[currentType.value]
  const baseY = h / 2

  // 清空
  ctx.clearRect(0, 0, w, h)

  // 网格
  ctx.strokeStyle = 'rgba(74,58,40,0.3)'; ctx.lineWidth = 0.5
  for (let y = 0; y < h; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
  for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }

  // 基线
  ctx.strokeStyle = 'rgba(74,58,40,0.5)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, baseY); ctx.lineTo(w, baseY); ctx.stroke()

  // 脉搏波
  ctx.strokeStyle = pt.color; ctx.lineWidth = 2.5
  ctx.shadowColor = pt.color + '44'; ctx.shadowBlur = 8
  ctx.beginPath()

  const t = Date.now() * 0.003

  for (let x = 0; x < w; x += 1) {
    let y = baseY
    const lt = t + x * 0.02

    if (pt.rhythm === 'regular') {
      const beat = Math.sin(lt * pt.freq * Math.PI * 2)
      const main = beat > 0.3 ? Math.pow((beat - 0.3) / 0.7, 0.6) * pt.amp * 35 : 0
      y = baseY - main - (beat > 0 ? Math.sin(lt * pt.freq * Math.PI * 4 + 1.5) * 0.3 * pt.amp * 35 : 0)
      if (beat < -0.3) y += Math.sin(lt * pt.freq * Math.PI * 0.5) * 0.1 * pt.amp * 35
    } else if (pt.rhythm === 'irregular') {
      const lf = pt.freq + Math.sin(lt * 0.3) * 0.4 + Math.sin(lt * 0.7) * 0.2
      const beat = Math.sin(lt * lf * Math.PI * 2)
      y = baseY - (beat > 0.4 ? Math.pow((beat - 0.4) / 0.6, 0.5) * pt.amp * 35 : 0) + (Math.random() - 0.5) * 6
    } else if (pt.rhythm === 'stopping') {
      const cp = (lt * 0.3) % 6
      if (cp < 2) {
        const beat = Math.sin(cp * Math.PI * 2)
        y = baseY - (beat > 0.3 ? Math.pow((beat - 0.3) / 0.7, 0.6) * pt.amp * 35 : 0)
      } else {
        y = baseY + (Math.random() - 0.5) * 1.5
      }
    }

    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.shadowBlur = 0

  ctx.fillStyle = 'rgba(201,168,76,0.4)'
  ctx.font = '11px sans-serif'
  ctx.fillText(pt.rate, 8, 16)

  animId = requestAnimationFrame(draw)
}

onMounted(() => { draw() })
onUnmounted(() => { if (animId) cancelAnimationFrame(animId) })
</script>
