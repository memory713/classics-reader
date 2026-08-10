/**
 * API 客户端 — SQLite 后端
 * 用户以手机号唯一标识
 */

// GitHub Pages: https://memory713.github.io/classics-reader/
// Railway Backend: https://classics-reader.railway.app
const API_BASE = import.meta.env.VITE_API_URL || 'https://classics-reader.railway.app/api'

// 登录/注册
export async function login(phone) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  })
  const json = await res.json()
  if (json.success) return json
  throw new Error(json.error || '登录失败')
}

// 获取用户数据
export async function fetchUserData(phone) {
  const res = await fetch(`${API_BASE}/data/${phone}`)
  const json = await res.json()
  if (json.success) return json.data
  throw new Error(json.error || '获取数据失败')
}

// 保存用户数据
export async function saveUserData(data, phone) {
  const res = await fetch(`${API_BASE}/data/${phone}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  })
  const json = await res.json()
  return json.success
}

// Token 自动登录
export async function tokenLogin(token) {
  const res = await fetch(`${API_BASE}/auth/token-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  })
  const json = await res.json()
  if (json.success) return json
  throw new Error(json.error || '自动登录失败')
}

// 退出登录
export async function logout(token) {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  })
}

// 排行榜
export async function fetchRankings(sort = 'reputation', limit = 50) {
  const res = await fetch(`${API_BASE}/rankings?sort=${sort}&limit=${limit}`)
  const json = await res.json()
  if (json.success) return json.list
  throw new Error(json.error || '获取排名失败')
}
