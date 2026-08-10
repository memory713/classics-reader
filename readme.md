# 🏮 岐黄问道录 — 黄帝内经修行之旅

> **经营养成 + 中医知识学习** 的 Web 游戏。将《黄帝内经》研读、473 味中药本草知识融入医馆经营玩法。
>
> 📖 研读 · 🌿 采药 · 🩺 坐诊 · 🏥 升级

---

## 📖 目录

- [系统架构](#-系统架构)
- [快速启动](#-快速启动)
- [项目结构](#-项目结构)
- [游戏系统设计](#-游戏系统设计)
- [数据库设计](#-数据库设计)
- [API 参考](#-api-参考)
- [数据流与关键逻辑](#-数据流与关键逻辑)
- [前端状态管理](#-前端状态管理)
- [部署指南](#-部署指南)
- [开发指南](#-开发指南)

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────┐
│                   浏览器                          │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ App.vue   │  │ 页面组件  │  │ gameStore.js │  │
│  │ (登录/导航)│  │ (4个主视图)│  │ (响应式状态)  │  │
│  └───────────┘  └──────────┘  └──────┬───────┘  │
│                                       │          │
│                             ┌─────────▼────────┐ │
│                             │   api.js (fetch)  │ │
│                             └─────────┬────────┘ │
└───────────────────────────────────────┼──────────┘
                                        │
                              Vite Proxy (/api → :3000)
                                        │
┌───────────────────────────────────────▼──────────┐
│                Express 后端 (port 3000)           │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ REST API │ │ 静态文件  │ │ 采药/坐诊生成引擎 │ │
│  └────┬─────┘ └──────────┘ └──────────────────┘ │
│       │                                          │
│  ┌────▼──────────────────────────────────────┐   │
│  │          SQLite (data/game.db)             │   │
│  │  ┌───────┐  ┌─────────────────────────┐   │   │
│  │  │ users │  │ game_data (JSON 存档)    │   │   │
│  │  └───────┘  └─────────────────────────┘   │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

### 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| **前端** | Vue 3 (Composition API, `<script setup>`) | SPA，无 vue-router，用 `state.currentView` 切换页面 |
| **构建** | Vite 5 + `@vitejs/plugin-vue` | 热更新，`@` 别名指向 `src/` |
| **后端** | Express 4 | REST API + 静态文件服务 |
| **数据库** | SQLite (via `better-sqlite3`) | WAL 模式，两表设计 |
| **样式** | CSS 自定义属性 | 暗色中医主题，移动端响应式 |

---

## 🚀 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 开发模式（需要两个终端）
# 终端1: Vite 开发服务器（热更新）
npm run dev          # → http://localhost:8080

# 终端2: Express 后端
npm run serve        # → http://localhost:3000

# 3. 生产模式
npm run build        # 构建到 dist/
npm start            # Express 同时提供 API + 静态文件
                     # → http://localhost:3000
```

> 💡 开发时访问 **Vite 端口**（默认 8080）才有热更新。API 请求通过 Vite 代理自动转发到 3000 端口。

---

## 📂 项目结构

```
gameDemo/
├── readme.md                 # 本文件
├── index.html                # 入口 HTML（加载 data.js + Vue 挂载点）
├── server.js                 # Express 后端（SQLite + REST API）
├── vite.config.js            # Vite 配置（代理 /api → :3000）
├── package.json              # 依赖与脚本
├── db.sh                     # SQLite 快捷查看脚本
│
├── css/
│   └── style.css             # 全局样式（~2100行，暗色中医主题）
│
├── js/
│   └── data.js               # GAME_DATA 全局常量（162章/9境/473药材/套装/Boss）
│
├── data/
│   ├── game.db               # SQLite 数据库（自动生成）
│   ├── neijing-xidu/         # 34 章《黄帝内经》富文本 JSON
│   │   ├── index.json        #   章节索引
│   │   └── sw01~sw34.json    #   每章含原文/译文/注释/解析
│   ├── materials/            # 473 味中药 JSON（按分类分文件）
│   │   └── manifest.json     #   药材清单索引（21 个分类）
│   └── user-data/            # 旧 JSON 存档（已自动迁移至 SQLite）
│
├── src/
│   ├── main.js               # Vue 应用入口（createApp + mount）
│   ├── App.vue               # 根组件（登录/导航/布局/Toast）
│   │
│   ├── stores/
│   │   └── gameStore.js      # 游戏状态管理（响应式 + API 持久化）
│   │
│   ├── utils/
│   │   ├── api.js            # API 客户端（login/save/rankings）
│   │   └── data-loader.js    # 章节富文本 JSON 加载器
│   │
│   ├── views/                # 4 个主页面 + 3 个嵌入子页面
│   │   ├── Clinic.vue        # 🏥 医馆（坐诊/升级/搬迁/家具商店）
│   │   ├── Reading.vue       # 📖 研读（原文对照/解析/课后小测/章节列表）
│   │   ├── HerbGathering.vue # 🌿 采药（辨药答题/药材图鉴）
│   │   ├── Profile.vue       # 🧑 个人（每日任务/状态/档案/研读进度/日志）
│   │   ├── Achievements.vue  # 🗄️ 百草药柜（通过个人中心进入）
│   │   └── Rankings.vue      # 📊 排行榜（通过个人中心进入）
│   │
│   └── components/
│       └── HerbQuiz.vue      # 草药辨药测验组件（3题自动提交）
│
├── design/
│   └── 医馆经营系统设计.md    # 完整数值设计文档
│
└── dist/                     # Vite 构建产物（生产模式）
```

### 未使用的文件

| 文件 | 说明 |
|------|------|
| `src/views/Dashboard.vue` | 总览（已合并到 Profile.vue） |
| `src/views/Pharmacy.vue` | 药庐页面（已废弃） |
| `src/components/PulseSimulator.vue` | 脉象模拟器（已废弃） |

---

## 🎮 游戏系统设计

### 核心循环

```
研读章节 ──→ 课后小测 ──→ 坐诊题库扩充 + 每日任务奖励
                                         │
                                         ▼
  坐诊（原文→选解析）──→ 金钱 + 声望
                                         │
                  ┌──────────────────────┘
                  ▼
      ┌─────────────────────┐
      │ 升级医馆（耗声望）    │──→ 诊金倍率↑ + 解锁城市
      │ 搬迁城市（耗金钱）    │──→ 基础诊金↑
      │ 购买家具（耗金钱）    │──→ 挂机收益 + 坐诊增益
      └─────────────────────┘
                  │
                  ▼
  采药辨药 ──→ 收集药材图鉴 ──→ 套装增益解锁
```

### 导航与页面

底部导航 4 项：**🏥 医馆 · 📖 研读 · 🌿 采药 · 🧑 个人**

| 页面 | 入口 | 功能 |
|------|------|------|
| 🏥 **医馆** | 底部导航 | 坐诊（原文→选解析）、升级（耗声望）、搬迁（耗金钱）、15件家具商店 |
| 📖 **研读** | 底部导航 | 原文·译文对照、逐句解析、课后小测（3题）、章节列表选择、自动定位未读 |
| 🌿 **采药** | 底部导航 | 随机药材卡片学习、3道辨药题（药性/功效/分类）、全对奖励心神+金钱+药材 |
| 🧑 **个人** | 底部导航 | 每日任务 · 当前状态 · 基本信息 · 研读进度 · 修行日志 |
| 🗄️ **药柜** | 个人→药柜 | 21套药材图鉴、收集进度条、套装增益描述 |
| 📊 **排行** | 个人→排行 | 声望/医馆等级/研读篇数三榜、手机号脱敏 |

### 核心数值公式

**诊金计算：**
```
诊金 = 城市基础诊金 × 医馆倍率 × (1 + 已读章节数 / 20) × 家具加成
医馆倍率 = 1.0 + (医馆等级 - 1) × 0.05
```

**升级消耗：**
```
升级所需声望 = 当前等级 × 100
```

**搬迁条件：**
```
医馆等级 ≥ 城市要求等级 且 金钱 ≥ 搬迁费
```

**城市等级要求：** `[1, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 95, 100]`

**研读测验奖励：**
```
3/3 全对 → 章节标记已读 + 金币奖励 = 100 × 已读章节数
2/3 通过 → 章节标记已读，无金币，可重新答题
≤1/3 失败 → 不标记已读，需重考
```

**每日任务奖励：**
| 任务 | 奖励 |
|------|------|
| 登录签到 | +50金 +5声望 +30心神 |
| 研读一章 | +100金 +10声望 |
| 完成小测 | +80金 +8声望 |
| 全部完成额外 | +200金 +20声望 |

### 医馆城市（18城）

从「🛖 青云村」（基础诊金 10）到「🏥 太医院」（基础诊金 1115），逐级解锁。

### 家具系统（15件）

每件家具有唯一 `key`，需达到指定医馆等级解锁。购买后提供：
- **挂机收益**：`income` 值（金币/小时）
- **特殊效果**：如诊金加成、声望加成、心神恢复等

### 药材套装（21套）

每套对应一个中药分类（如解表药、清热药），收集达到目标数量解锁全局增益。

---

## 🗄️ 数据库设计

### 表结构

#### `users` 表 — 用户排名数据

```sql
CREATE TABLE users (
    phone           TEXT PRIMARY KEY,        -- 手机号（11位，唯一标识）
    player_name     TEXT DEFAULT '求道者',   -- 默认玩家名
    nickname        TEXT DEFAULT NULL,       -- 昵称（可改一次）
    nickname_changed INTEGER DEFAULT 0,      -- 昵称是否已修改
    money           INTEGER DEFAULT 0,       -- 金钱
    reputation      INTEGER DEFAULT 0,       -- 声望
    clinic_level    INTEGER DEFAULT 1,       -- 医馆等级
    read_count      INTEGER DEFAULT 0,       -- 已读章节数
    created_at      TEXT NOT NULL,           -- 创建时间
    updated_at      TEXT NOT NULL            -- 更新时间
);
```

> `users` 表主要用于**排行榜查询**，通过 SQL 的 `ORDER BY` 直接排序。

#### `game_data` 表 — 完整游戏存档

```sql
CREATE TABLE game_data (
    phone      TEXT PRIMARY KEY,             -- 手机号（关联 users）
    data       TEXT NOT NULL,                -- 完整游戏状态 JSON
    updated_at TEXT NOT NULL,
    FOREIGN KEY (phone) REFERENCES users(phone)
);
```

> `data` 字段存储完整游戏状态的 JSON 字符串。这种设计简化了模式变更——新增字段只需修改前端的默认值对象，无需迁移数据库。

### 存档 JSON 结构（`game_data.data`）

```typescript
{
  // 用户信息
  phone: string,
  playerName: string,
  nickname: string,
  nicknameChanged: boolean,

  // 属性
  mind: number,               // 当前心神
  maxMind: number,            // 心神上限

  // 研读
  readChapters: number[],     // 已读章节 ID 列表
  quizResults: Record<string, { score, maxScore, passed, bonus, timestamp }>,

  // 药材
  herbs: Record<string, number>,          // 药材库存 { 名称: 数量 }
  herbCollection: Record<string, string>, // 药材图鉴 { 名称: 分类名 }

  // 医馆经营
  money: number,
  reputation: number,
  clinicLevel: number,
  cityIndex: number,            // 当前城市索引（0-17）
  furniture: Record<string, boolean>,  // 家具拥有状态

  // 系统
  token: string,                // 自动登录令牌
  currentChapter: number | null,
  lastLoginDate: string | null,
  streak: number,
  dailyTasks: { read, quiz, login, date },
  dailyBonusClaimed: boolean,
  activityLog: { time, text }[],
  statHistory: { type, amount, reason, time }[], // 数值变动历史
  totalQuizzesPassed: number,
  perfectScores: number,
}
```

---

## 🌐 API 参考

所有 API 以 `/api` 为前缀。开发模式下通过 Vite 代理转发到 Express。

### 1. 登录/注册

```
POST /api/auth/login
Body: { phone: "13800138001" }
Response: { success: true, phone, token, isNew: boolean, data: {...} }
```

- 手机号自动注册（无需密码）
- 每日首次登录：+1 连续天数，+30 心神 / +50金 / +5声望，标记签到
- 登录返回 `token`，客户端保存用于自动登录
- 自动迁移旧 JSON 存档（`data/user-data/{phone}.json`）

### 2. Token 自动登录

```
POST /api/auth/token-login
Body: { token: "uuid-string" }
Response: { success: true, phone, data: {...} }
```

- 用 token 换取用户数据，token 无效则返回 `success: false`

### 3. 退出登录

```
POST /api/auth/logout
Body: { token: "uuid-string" }
Response: { success: true }
```

- 清除服务端保存的 token

### 4. 获取用户数据

```
GET /api/data/:phone
Response: { success: true, phone, data: {...} }
```

### 5. 保存用户数据

```
POST /api/data/:phone
Body: { data: {...} }
Response: { success: true, phone, updatedAt }
```

- 同时更新 `users` 表（排行）和 `game_data` 表（完整存档）

### 6. 排行榜

```
GET /api/rankings?sort=reputation&limit=50
Sort 可选: money | reputation | clinic_level | read_count
```

### 7. 修改昵称

```
POST /api/user/nickname
Body: { phone: "13800138001", nickname: "新昵称" }
```
- 每个用户仅能修改一次

### 8. 采药辨题

```
GET /api/herb-card
Response: { card: { name, pinyin, property, effect, ... },
            questions: [{ type, question, options, answer }],
            rewardHerb: string }
```

- 随机从 473 味药材中选一味，生成 3 道题（药性/功效/分类）

### 9. 坐诊辨题

```
GET /api/consultation?chapters=1,2,3,...
Response: { question: { text, options, answer, chapterId, source } }
```

- 从已读章节的「解析」中随机选一条，生成选择题

### 10. 静态文件

生产模式下，Express 自动提供 `dist/` 目录。非 API 请求返回 `index.html`（SPA 路由）。

---

## 🔄 数据流与关键逻辑

### 登录流程

```
用户输入手机号 → App.vue::doLogin()
  → gameStore.login(phone)
    → api.login(phone) POST /api/auth/login
      → 服务端: 查 DB → 不存在则创建默认存档 → 每日签到
      → 生成 token → 返回 data + token
    → Object.assign(state, data)  ← 服务端 JSON 覆盖前端默认 state
    → localStorage 存储 token（自动登录）

页面加载时自动登录：
  → localStorage 读取 token
    → gameStore.tokenLogin(token) POST /api/auth/token-login
      → 服务端查找 token → 返回 data
    → token 无效 → 显示登录页面
```

### 数据保存机制

```
任意操作 → gameStore 方法 → 修改 state
  → this.save()
    → 防重复提交: saving 标志 + savePending 队列
    → POST /api/data/:phone 发送完整 state（全量保存）
```

> ⚠️ `save()` 是全量保存，所有持久化字段都会发送到服务端。

### 研读·测验流程

```
进入研读页 → auto-position 到第一篇未读章节
  → 点击「课后小测」→ startQuiz(chapter)
    → 3 道题逐题作答（选择后自动提交，800ms 自动下一题）
    → 3/3 → 标记已读 + 金币奖励 = 100 × 已读章节数
      2/3 → 标记已读，无金币，可重考
      ≤1/3 → 不标记已读
```

### 采药·辨药流程

```
进入采药页 → fetch /api/herb-card
  → 学习阶段: 显示药材完整信息
  → 答题阶段: 3 道题
    → 全对 → 心神+50, 金钱+250, 声望+25, 收集药材
    → 未全对 → 可重答
```

### 药材分类映射

```
manifest chapter_title: "清 热 药"（带空格）
HERB_SET_BONUSES chapter: "清热药"（无空格）

存储: herbCollection[herbName] = chapter_title.replace(/\s+/g, '')
查阅: Achievements.vue 中按分类名统计各套收集进度
```

---

## 🧠 前端状态管理

### gameStore 核心设计

```javascript
const state = reactive({...})     // 响应式状态
const actions = { ... }           // 方法
const computedValues = { ... }    // 计算属性

export function useGameStore() {
  return { state, ...actions, ...computedValues }
}
```

### 使用方式

```javascript
// 方式1: reactive 包装（模板中实时响应）
const store = reactive(useGameStore())
// 适用于 Clinic.vue、Achievements.vue

// 方式2: 解构（computed 仍响应）
const { state, readCount } = store
// 适用于 Reading.vue、HerbGathering.vue
```

### 持久化 vs 运行时字段

**持久化（保存到服务端）：** `phone`, `token`, `nickname`, `playerName`, `mind`, `maxMind`, `readChapters`, `quizResults`, `herbs`, `money`, `reputation`, `clinicLevel`, `cityIndex`, `furniture`, `herbCollection`, `dailyBonusClaimed`, `activityLog`, `statHistory` 等

**运行时（不保存）：** `loaded`, `saving`, `savePending`, `currentView`, `quizChapterId`, `quizQuestions`, `quizIndex`, `quizScore`, `quizAnswered`, `quizSelected`, `richData`, `readingLoading` 等

---

## 🚢 部署指南

### 生产构建

```bash
npm run build        # Vite 构建到 dist/
npm start            # Express 提供 API + 静态文件
```

### 使用 PM2

```bash
npm install -g pm2
pm2 start server.js --name qihuang
pm2 save
pm2 startup
```

### 端口配置

- Express 默认 `3000`，通过 `PORT` 环境变量修改
- Vite 默认 `8080`，开发用。端口冲突时自动尝试下一个

### nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🛠️ 开发指南

### 新增页面

1. 在 `src/views/` 创建 `.vue` 文件
2. 在 `App.vue` 中 import 并注册（`v-show="state.currentView === 'xxx'"`）
3. 在导航栏 `navs` 数组中添加按钮
4. 如需持久化数据，在 `gameStore.state` 中添加字段

### 新增 API

1. 在 `server.js` 中添加 Express 路由
2. 在 `src/utils/api.js` 中添加 fetch 函数

### 修改数据库

- 添加新列：在 `server.js` 的迁移循环中添加 `ALTER TABLE` 语句
- 添加新表：在 `db.exec()` 块中添加 `CREATE TABLE IF NOT EXISTS`
- 同步更新 `writeGameData()` 中写入 `users` 表的字段

### 数据文件

- **章节内容**：`data/neijing-xidu/*.json`
- **药材数据**：`data/materials/`（473 味）
- **游戏常量**：`js/data.js`（章节/境界/阶位/Boss）
- **医馆常量**：`src/stores/gameStore.js`（城市/家具/药材套装）

### 移动端适配

- 底部导航栏（固定）
- 响应式断点：768px（平板）、480px（手机）
- `touch-action: manipulation` 禁止双击缩放

---

## 📋 开发计划

- [x] Vue 3 前端框架，底部 4 项导航
- [x] Express + SQLite 后端与 REST API
- [x] 手机号登录 + Token 自动登录
- [x] 研读系统（34章原文+课后小测+章节列表）
- [x] 医馆经营（坐诊/升级/搬迁/家具）
- [x] 采药辨药（473味药材+3题测验）
- [x] 百草药柜（21套药材图鉴）
- [x] 排行榜（声望/等级/研读三榜）
- [x] 每日任务（金币+声望奖励）
- [x] 数值变动历史（点击查看明细）
- [x] 数据持久化（SQLite + 全量 JSON 存档）
- [x] 移动端响应式适配
- [ ] Boss 战系统
- [ ] 药庐/药性精华合成
- [ ] 社交系统（好友/切磋）

---

*项目持续开发中。接手后如有疑问，可查阅 `design/医馆经营系统设计.md` 了解数值设计细节。*

## 🏗️ 开发

```bash
# 构建前端
npm run build

# 仅后端开发
node server.js

# 仅前端开发（热更新）
npx vite
```
