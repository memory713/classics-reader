/**
 * 章节数据加载器 — 加载 data/neijing-xidu/*.json
 * 此为纯前端工具，依赖 GAME_DATA 和 fetch
 */

const basePath = '/data/neijing-xidu'
const _cache = {}

export async function loadChapterData(chapterNumber, type = 'suwen') {
  const prefix = type === 'lingshu' ? 'ls' : 'sw'
  const id = `${prefix}${String(chapterNumber).padStart(2, '0')}`
  if (_cache[id]) return _cache[id]

  try {
    const res = await fetch(`${basePath}/${id}.json`)
    if (!res.ok) return null
    const data = await res.json()
    _cache[id] = data
    return data
  } catch {
    return null
  }
}

export function renderOriginalWithFootnotes(original, footnotes) {
  if (!original) return ''
  let html = original
  html = html.replace(/\[(\d+)\]/g, (match, num) => {
    const fn = footnotes[num]
    if (fn) {
      const safeW = escapeAttr(fn.word)
      const safeC = escapeAttr(fn.content)
      return `<sup class="footnote-ref" data-fn-word="${safeW}" data-fn-content="${safeC}" title="点击查看注释">[${num}]</sup>`
    }
    return match
  })
  return html.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('')
}

export function renderTranslation(translation) {
  if (!translation) return ''
  return translation.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('')
}

export function renderAnalysis(analysis) {
  if (!analysis || !analysis.length) return ''
  return analysis.map((item, idx) => {
    const title = item[0] || ''
    const content = item[1] || ''
    return `<div class="analysis-item">
      <div class="analysis-title" data-idx="${idx}">
        <span class="analysis-toggle">▶</span>${escapeHtml(title)}
      </div>
      <div class="analysis-content" style="display:none;"><p>${escapeHtml(content)}</p></div>
    </div>`
  }).join('')
}

export function renderFootnoteContent(text) {
  if (!text) return ''
  return text.replace(/\{'(.*?)'\}/g, '<span class="fn-highlight">「$1」</span>').replace(/\n/g, '<br>')
}

function escapeAttr(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function escapeHtml(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/\n/g, '<br>')
    .replace(/\{'(.*?)'\}/g, '<span class="fn-highlight">「$1」</span>')
}
