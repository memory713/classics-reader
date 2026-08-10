/**
 * 岐黄问道录 — 后端服务器
 * 提供：1) 静态文件服务  2) 用户数据持久化 API  3) 排行榜
 * 存储：SQLite (data/game.db) — ACID、SQL 排名、零配置
 */
import express from 'express'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json({ limit: '10mb' }))

// ========================================
// SQLite 数据库初始化
// ========================================
const DB_PATH = path.join(__dirname, 'data', 'game.db')
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    phone        TEXT PRIMARY KEY,
    player_name  TEXT DEFAULT '求道者',
    money        INTEGER DEFAULT 0,
    reputation   INTEGER DEFAULT 0,
    clinic_level INTEGER DEFAULT 1,
    read_count   INTEGER DEFAULT 0,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS game_data (
    phone      TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (phone) REFERENCES users(phone)
  );
`)

// 迁移：添加 nickname 列（兼容旧表）
for (const col of [
  'ALTER TABLE users ADD COLUMN nickname TEXT DEFAULT NULL',
  'ALTER TABLE users ADD COLUMN nickname_changed INTEGER DEFAULT 0'
]) {
  try { db.exec(col) } catch (e) { /* 列已存在，忽略 */ }
}

// 预编译语句
const stmt = {
  upsertUser: db.prepare(`
    INSERT INTO users (phone, player_name, money, reputation, clinic_level, read_count, nickname, nickname_changed, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(phone) DO UPDATE SET
      player_name=excluded.player_name, money=excluded.money,
      reputation=excluded.reputation, clinic_level=excluded.clinic_level,
      read_count=excluded.read_count,
      nickname=excluded.nickname, nickname_changed=excluded.nickname_changed,
      updated_at=excluded.updated_at
  `),
  getUser: db.prepare('SELECT * FROM users WHERE phone = ?'),
  getGameData: db.prepare('SELECT data FROM game_data WHERE phone = ?'),
  upsertGameData: db.prepare(`
    INSERT INTO game_data (phone, data, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(phone) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at
  `),
  ranking: (sort, limit) => db.prepare(`
    SELECT phone, player_name, nickname, money, reputation, clinic_level, read_count
    FROM users ORDER BY ${sort} DESC LIMIT ?
  `).all(limit)
}

// ========================================
// 用户数据工具函数
// ========================================
function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

function getDefaultData(phone) {
  return {
    phone,
    playerName: '求道者',
    cultivation: 0, mind: 100, maxMind: 100,
    readChapters: [], quizResults: {}, herbs: {},
    proverbs: [], achievements: {}, inventory: [],
    currentChapter: null, lastLoginDate: null, streak: 0,
    dailyTasks: { read: false, quiz: false, login: false, date: null },
    dailyBonusClaimed: false,
    statHistory: [],
    activityLog: [], bossDefeated: [],
    totalQuizzesPassed: 0, perfectScores: 0,
    money: 0, reputation: 0, clinicLevel: 1, cityIndex: 0,
    furniture: {}, herbCollection: {},
    token: '',
    updatedAt: null, createdAt: new Date().toISOString()
  }
}

function readGameData(phone) {
  const row = stmt.getGameData.get(phone)
  return row ? JSON.parse(row.data) : null
}

function writeGameData(phone, data) {
  const now = new Date().toISOString()
  // 先写 users（父表），再写 game_data（子表）
  stmt.upsertUser.run(
    phone,
    data.playerName || '求道者',
    data.money || 0,
    data.reputation || 0,
    data.clinicLevel || 1,
    (data.readChapters || []).length,
    data.nickname || null,
    data.nicknameChanged ? 1 : 0,
    data.createdAt || now,
    now
  )
  stmt.upsertGameData.run(phone, JSON.stringify(data), now)
}

// ---- 迁移旧 JSON 数据 ----
function migrateOldData(phone) {
  const oldFile = path.join(__dirname, 'data', 'user-data', `${phone}.json`)
  if (!fs.existsSync(oldFile)) return false
  try {
    const data = JSON.parse(fs.readFileSync(oldFile, 'utf-8'))
    writeGameData(phone, data)
    fs.renameSync(oldFile, oldFile + '.migrated')
    console.log(`📦 已迁移: ${phone}`)
    return true
  } catch (e) {
    console.error(`迁移失败 ${phone}:`, e.message)
    return false
  }
}

// ========================================
// API：登录/注册
// ========================================
app.post('/api/auth/login', (req, res) => {
  const { phone } = req.body
  if (!phone || !isValidPhone(phone)) {
    return res.status(400).json({ success: false, error: '请输入正确的11位手机号' })
  }

  // 尝试迁移旧数据
  migrateOldData(phone)

  let data = readGameData(phone)
  const isNew = !data

  if (isNew) {
    data = getDefaultData(phone)
    writeGameData(phone, data)
  }

  // 每日登录
  const today = new Date().toISOString().slice(0, 10)
  if (data.lastLoginDate !== today) {
    data.lastLoginDate = today
    data.streak = (data.streak || 0) + 1
    if (!data.dailyTasks) data.dailyTasks = { read: false, quiz: false, login: false, date: null }
    if (data.dailyTasks.date !== today) {
      data.dailyTasks = { read: false, quiz: false, login: true, date: today }
      data.dailyBonusClaimed = false
      data.mind = Math.min(data.maxMind, data.mind + 30)
      data.money = (data.money || 0) + 50
      data.reputation = (data.reputation || 0) + 5
    }
    writeGameData(phone, data)
  }

  // 生成 token
  const token = crypto.randomUUID()
  data.token = token
  writeGameData(phone, data)

  res.json({ success: true, phone, token, isNew, data })
})

// Token 自动登录
app.post('/api/auth/token-login', (req, res) => {
  const { token } = req.body
  if (!token) {
    return res.status(400).json({ success: false, error: '缺少 token' })
  }
  // 遍历 game_data 查找 token 匹配
  const rows = db.prepare('SELECT phone, data FROM game_data').all()
  for (const row of rows) {
    try {
      const d = JSON.parse(row.data)
      if (d.token === token) {
        return res.json({ success: true, phone: row.phone, data: d })
      }
    } catch (e) { /* skip */ }
  }
  res.json({ success: false, error: 'token 无效或已过期' })
})

// 退出登录（清除 token）
app.post('/api/auth/logout', (req, res) => {
  const { token } = req.body
  if (!token) return res.json({ success: true })
  const rows = db.prepare('SELECT phone, data FROM game_data').all()
  for (const row of rows) {
    try {
      const d = JSON.parse(row.data)
      if (d.token === token) {
        delete d.token
        writeGameData(row.phone, d)
        break
      }
    } catch (e) { /* skip */ }
  }
  res.json({ success: true })
})

// 获取用户数据
app.get('/api/data/:phone', (req, res) => {
  const phone = req.params.phone
  if (!isValidPhone(phone)) {
    return res.status(400).json({ success: false, error: '无效的手机号' })
  }
  const data = readGameData(phone)
  if (!data) {
    return res.status(404).json({ success: false, error: '用户不存在' })
  }
  res.json({ success: true, phone, data })
})

// 保存用户数据
app.post('/api/data/:phone', (req, res) => {
  const phone = req.params.phone
  if (!isValidPhone(phone)) {
    return res.status(400).json({ success: false, error: '无效的手机号' })
  }
  const { data } = req.body
  if (!data) {
    return res.status(400).json({ success: false, error: '缺少 data 字段' })
  }
  data.updatedAt = new Date().toISOString()
  writeGameData(phone, data)
  res.json({ success: true, phone, updatedAt: data.updatedAt })
})

// ========================================
// API：排行榜
// ========================================
app.get('/api/rankings', (req, res) => {
  const sort = ['money','reputation','clinic_level','read_count'].includes(req.query.sort)
    ? req.query.sort : 'reputation'
  const limit = Math.min(parseInt(req.query.limit) || 50, 100)
  const list = stmt.ranking(sort, limit).map((u, i) => ({ ...u, rank: i + 1 }))
  res.json({ success: true, sort, list })
})

// 修改昵称（仅一次）
app.post('/api/user/nickname', (req, res) => {
  const { phone, nickname } = req.body
  if (!phone || !isValidPhone(phone)) {
    return res.status(400).json({ success: false, error: '无效的手机号' })
  }
  const nn = (nickname || '').trim()
  if (!nn || nn.length < 1 || nn.length > 12) {
    return res.status(400).json({ success: false, error: '昵称需1-12个字符' })
  }
  const user = stmt.getUser.get(phone)
  if (!user) return res.status(404).json({ success: false, error: '用户不存在' })
  if (user.nickname_changed) {
    return res.status(400).json({ success: false, error: '昵称只能修改一次' })
  }

  db.prepare('UPDATE users SET nickname = ?, nickname_changed = 1, updated_at = ? WHERE phone = ?')
    .run(nn, new Date().toISOString(), phone)

  // 同步更新 game_data JSON
  const row = stmt.getGameData.get(phone)
  if (row) {
    const data = JSON.parse(row.data)
    data.nickname = nn
    data.nicknameChanged = true
    stmt.upsertGameData.run(phone, JSON.stringify(data), new Date().toISOString())
  }

  res.json({ success: true, phone, nickname: nn })
})

// ========================================
// 药材辨识·采药 API
// ========================================
const MATERIALS_DIR = path.join(__dirname, 'data', 'materials')

let _allHerbs = null
function loadAllHerbs() {
  if (_allHerbs) return _allHerbs
  _allHerbs = []
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(MATERIALS_DIR, 'manifest.json'), 'utf-8'))
    for (const ch of manifest.chapters || []) {
      for (const sec of ch.sections || []) {
        const filePath = path.join(MATERIALS_DIR, sec.file)
        if (fs.existsSync(filePath)) {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
          for (const herb of (data.herbs || [])) {
            _allHerbs.push({
              name: herb.name,
              pinyin: herb.pinyin,
              source: herb.文献标题 || '',
              overview: herb.概述 || '',
              property: herb.药性 || '',
              effect: herb.功效 || '',
              usage: herb.用法用量 || '',
              caution: herb.使用注意 || '',
              differential: herb.鉴别用药 || '',
              ancient: herb.古籍摘要 || '',
              modern: herb.现代研究 || '',
              application: herb.应用 || '',
              category: ch.chapter_title,
              section: sec.section_title
            })
          }
        }
      }
    }
  } catch (e) {
    console.error('加载药材数据失败:', e.message)
  }
  return _allHerbs
}

// 从所有药材中收集各类属性值（用于生成干扰项）
function _allPropertyValues() {
  const all = loadAllHerbs()
  return [...new Set(all.map(h => h.property).filter(Boolean))]
}
function _allUsageValues() {
  const all = loadAllHerbs()
  return [...new Set(all.map(h => h.usage).filter(Boolean))]
}
function _allSectionValues() {
  const all = loadAllHerbs()
  return [...new Set(all.map(h => h.section).filter(Boolean))]
}

// 从数组中随机取 N 个不重复的干扰值（排除正确答案）
function _distractors(arr, correct, n = 3) {
  const pool = arr.filter(v => v && v !== correct)
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

// 构建选项：正确值 + 干扰值，打乱后返回
function _buildOptions(correct, distractors) {
  const opts = [correct, ...distractors].sort(() => Math.random() - 0.5)
  return { options: opts, answer: opts.indexOf(correct) }
}

/**
 * 采药 API：返回一张随机药材卡片 + 5道针对该药材的题目
 * 全部答对奖励：心神 +50 + 随机药材材料
 */
app.get('/api/herb-card', (req, res) => {
  const all = loadAllHerbs()
  if (all.length === 0) {
    return res.json({ success: false, error: '药材数据未加载' })
  }

  // 随机选一味药材
  const herb = all[Math.floor(Math.random() * all.length)]

  // 生成 5 道题
  const questions = []

  // Q1: 药性
  const propDistractors = _distractors(_allPropertyValues(), herb.property, 3)
  if (propDistractors.length >= 3) {
    const q1 = _buildOptions(herb.property, propDistractors)
    questions.push({
      id: 0,
      type: 'property',
      question: `「${herb.name}」的药性是什么？`,
      ...q1
    })
  }

  // Q2: 功效
  const effectDistractors = _distractors(all.map(h => h.effect), herb.effect, 3)
  if (effectDistractors.length >= 3) {
    const q2 = _buildOptions(herb.effect, effectDistractors)
    questions.push({
      id: 1,
      type: 'effect',
      question: `「${herb.name}」的功效是什么？`,
      ...q2
    })
  }

  // Q3: 分类
  const sectionDistractors = _distractors(_allSectionValues(), herb.section, 3)
  if (sectionDistractors.length >= 3) {
    const q3 = _buildOptions(herb.section, sectionDistractors)
    questions.push({
      id: 2,
      type: 'section',
      question: `「${herb.name}」属于哪一类药材？`,
      ...q3
    })
  }

  // Q4: 归经推断——从药性中提取"归X经"部分
  const meridianMatch = herb.property && herb.property.match(/归([^。]+)/)
  const meridian = meridianMatch ? meridianMatch[1].trim() : null
  if (meridian) {
    const allMeridians = [...new Set(all.map(h => {
      const m = h.property && h.property.match(/归([^。]+)/)
      return m ? m[1].trim() : null
    }).filter(Boolean))]
    const meridianDistractors = _distractors(allMeridians, meridian, 3)
    if (meridianDistractors.length >= 3) {
      const q4 = _buildOptions(meridian, meridianDistractors)
      questions.push({
        id: 3,
        type: 'meridian',
        question: `「${herb.name}」的药性归于哪条（或哪些）经络？`,
        ...q4
      })
    }
  }

  // Q5: 寒热属性推断——从药性中提取温/热/寒/凉/平
  const natureMatch = herb.property && herb.property.match(/[温热寒凉平]/)
  const nature = natureMatch ? natureMatch[0] : null
  const natureMeaning = { '温': '温性散寒，适合寒性病症', '热': '热性驱寒，适合虚寒重症',
    '寒': '寒性清热，适合热性病症', '凉': '凉性清热，适合风热表证', '平': '药性平和，寒热皆宜' }
  if (nature && natureMeaning[nature]) {
    const otherNatures = Object.keys(natureMeaning).filter(n => n !== nature)
    const shuffled = otherNatures.sort(() => Math.random() - 0.5).slice(0, 3)
    const options = [natureMeaning[nature], ...shuffled.map(n => natureMeaning[n])]
      .sort(() => Math.random() - 0.5)
    const answer = options.indexOf(natureMeaning[nature])
    questions.push({
      id: 4,
      type: 'nature',
      question: `「${herb.name}」药性属「${nature}」，以下哪个描述最准确？`,
      options,
      answer
    })
  }

  // 补齐到5题（如果某些维度干扰项不够）
  while (questions.length < 5) {
    const other = all.filter(h => h.name !== herb.name)
      .sort(() => Math.random() - 0.5)[0]
    if (!other) break
    const q = _buildOptions(other.name,
      _distractors(all.map(h => h.name), other.name, 3))
    questions.push({
      id: questions.length,
      type: 'name',
      question: `以下哪味药不属于「${herb.section}」？`,
      ...q
    })
  }

  // 只取前3题（药性、功效、分类）
  const finalQuestions = questions.slice(0, 3)

  // 奖励当前药材
  const rewardHerbName = herb.name

  res.json({
    success: true,
    card: {
      name: herb.name,
      pinyin: herb.pinyin,
      source: herb.source,
      overview: herb.overview,
      property: herb.property,
      effect: herb.effect,
      usage: herb.usage,
      caution: herb.caution,
      differential: herb.differential,
      ancient: herb.ancient,
      modern: herb.modern,
      application: herb.application,
      category: herb.category,
      section: herb.section
    },
    questions: finalQuestions,
    rewardHerb: rewardHerbName
  })
})

// ========================================
// 坐诊 API — 从已读章节生成原文→译文选择题
// ========================================
app.get('/api/consultation', (req, res) => {
  const chapters = (req.query.chapters || '').split(',').map(Number).filter(Boolean)
  if (chapters.length === 0) {
    return res.json({ success: false, error: '没有已读章节' })
  }

  // 加载所有章节数据
  const neijingDir = path.join(__dirname, 'data', 'neijing-xidu')
  const indexFile = path.join(neijingDir, 'index.json')
  let chapterMap = {}
  try {
    const index = JSON.parse(fs.readFileSync(indexFile, 'utf-8'))
    for (const ch of (index.chapters || [])) {
      chapterMap[ch.id] = { id: ch.id, number: ch.number, title: ch.title, book: ch.book }
    }
  } catch (e) {
    return res.json({ success: false, error: '章节索引加载失败' })
  }

  // 随机选一章，取一条解析：title(原文短语)作病人自述，content(解析)作正确答案
  const shuffled = chapters.sort(() => Math.random() - 0.5)
  let pickedChapter = null
  let pickedAnalysis = null

  for (const chId of shuffled) {
    // 映射 data.js 的 chapter.id → 文件名
    // 素问: chId 1-22 → sw01~sw22
    // 灵枢: chId 23+ → ls(chId - 22)
    let fileId, book
    if (chId >= 1 && chId <= 22) {
      fileId = `sw${String(chId).padStart(2, '0')}`
      book = '素问'
    } else {
      fileId = `ls${String(chId - 22).padStart(2, '0')}`
      book = '灵枢'
    }
    const entry = Object.entries(chapterMap).find(([id, info]) =>
      id === fileId && info.book === book
    )
    if (!entry) continue

    const [fileKey, info] = entry
    const filePath = path.join(neijingDir, `${fileKey}.json`)
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      if (data.sections) {
        // 收集所有解析条目
        const allAnalysis = []
        for (const s of data.sections) {
          if (s.analysis) {
            for (const a of s.analysis) {
              if (a[0] && a[1]) allAnalysis.push({ title: a[0], content: a[1] })
            }
          }
        }
        if (allAnalysis.length > 0) {
          pickedChapter = { id: chId, ...info }
          pickedAnalysis = allAnalysis[Math.floor(Math.random() * allAnalysis.length)]
          break
        }
      }
    } catch (e) { continue }
  }

  if (!pickedChapter || !pickedAnalysis) {
    return res.json({ success: false, error: '无法生成题目' })
  }

  // 生成干扰项：从其他章节随机取解析内容
  const allDistractors = []
  for (const [fileId, info] of Object.entries(chapterMap)) {
    if (info.id === pickedChapter.id) continue
    try {
      const fp = path.join(neijingDir, `${fileId}.json`)
      const data = JSON.parse(fs.readFileSync(fp, 'utf-8'))
      if (data.sections) {
        for (const s of data.sections) {
          if (s.analysis) {
            for (const a of s.analysis) {
              if (a[1]) allDistractors.push(a[1])
            }
          }
        }
      }
    } catch (e) {}
  }

  const correctText = pickedAnalysis.content
  const distractors = allDistractors
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)

  const options = [correctText, ...distractors].sort(() => Math.random() - 0.5)
  const answer = options.indexOf(correctText)

  res.json({
    success: true,
    question: {
      text: pickedAnalysis.title,
      options: options,
      answer,
      chapterId: pickedChapter.number || pickedChapter.id,
      source: `${pickedChapter.book || ''}${pickedChapter.number || pickedChapter.id}·${pickedChapter.title || ''}`
    }
  })
})

// ========================================
// 静态文件服务
// ========================================
const distPath = path.join(__dirname, 'dist')

// 1) Vite 构建产物（优先）
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
}

// 2) 项目根目录（js/ css/ data/ 等）
app.use(express.static(__dirname))

// 3) SPA fallback: 所有非 API 请求返回 index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const distIndex = path.join(distPath, 'index.html')
    if (fs.existsSync(distIndex)) {
      res.sendFile(distIndex)
    } else {
      res.status(404).send('未找到页面，请先执行 npm run build')
    }
  }
})

if (fs.existsSync(distPath)) {
  console.log(`📁 构建产物: ${distPath}`)
}
console.log(`📁 静态资源: ${__dirname}`)

// ========================================
// 启动
// ========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log('')
  console.log('==========================================')
  console.log('  岐黄问道录 — 黄帝内经修行之旅')
  console.log('==========================================')
  console.log('')
  console.log(`  📡 本地访问:  http://localhost:${PORT}`)
  console.log(`  🌐 局域网访问: http://<本机IP>:${PORT}`)
  console.log(`  💾 数据库:     ${DB_PATH}`)
  console.log('')
  console.log('  按 Ctrl+C 停止服务器')
  console.log('')
})
