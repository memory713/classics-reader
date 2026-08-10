#!/bin/bash
# 岐黄问道录 — 数据库快捷查看
# 用法:
#   bash db.sh           🏆 排行榜
#   bash db.sh users     👥 所有用户（含字段说明）
#   bash db.sh user 手机号  🔍 查某个用户
#   bash db.sh schema    📐 表结构
#   bash db.sh all       📊 完整数据
#   bash db.sh delete 手机号  🗑️ 删除用户及其所有数据
#   bash db.sh sql "SQL" 🎯 执行自定义SQL

DB="/Users/calla/Documents/personal/gameDemo/data/game.db"

case "${1:-rank}" in
  rank|ranking)
    limit="${2:-20}"
    echo "🏆 岐黄排行榜（按声望降序，取前${limit}名）"
    echo "═════════════════════════════════════════════════════════════"
    sqlite3 -column -header "$DB" \
      "SELECT row_number() OVER (ORDER BY reputation DESC) AS '#',
              CASE WHEN nickname IS NOT NULL AND nickname != '' THEN nickname ELSE substr(phone,1,3)||'****'||substr(phone,7) END AS '昵称/手机',
              money AS '💰金币', reputation AS '⭐声望',
              clinic_level AS '📊医馆', read_count AS '📖已读'
       FROM users ORDER BY reputation DESC LIMIT ${limit};"
    ;;
  users)
    echo "👥 用户列表（字段说明）"
    echo "═════════════════════════════════════════════════════════════"
    echo "phone         = 手机号（唯一ID）"
    echo "player_name   = 默认名称（求道者）"
    echo "nickname      = 昵称（用户自定，可改一次）"
    echo "nickname_ch   = 昵称是否已锁定（0=可改 1=已锁）"
    echo "money         = 💰 金币"
    echo "reputation    = ⭐ 声望"
    echo "clinic_level  = 📊 医馆等级 1~100"
    echo "read_count    = 📖 已读章节数"
    echo "realm         = 🧘 境界（0=炼气~8=飞升）"
    echo "created_at    = 📅 注册时间"
    echo "updated_at    = 🔄 最后更新"
    echo "─────────────────────────────────────────────────────────────"
    sqlite3 -column -header "$DB" \
      "SELECT phone, player_name, nickname,
              CASE WHEN nickname_changed THEN '✅已锁' ELSE '✏️可改' END AS '昵称状态',
              money, reputation, clinic_level, read_count, realm
       FROM users ORDER BY updated_at DESC;"
    ;;
  user)
    phone="${2:-13800138000}"
    echo "🔍 查询用户: ${phone}"
    echo "═════════════════════════════════════════════════"
    sqlite3 -line "$DB" "SELECT * FROM users WHERE phone = '${phone}';"
    echo "---"
    echo "📦 存档数据大小:"
    sqlite3 "$DB" "SELECT length(data) || ' bytes' AS 存档大小 FROM game_data WHERE phone = '${phone}';"
    ;;
  schema)
    echo "📐 数据库表结构"
    echo "═══════════════════════════════════════════════════"
    sqlite3 "$DB" ".schema"
    ;;
  all|full)
    echo "=== 🏆 排行榜（前10） ==="
    sqlite3 -column -header "$DB" \
      "SELECT row_number() OVER (ORDER BY reputation DESC) AS '#',
              CASE WHEN nickname IS NOT NULL AND nickname != '' THEN nickname ELSE substr(phone,1,3)||'****'||substr(phone,7) END AS 玩家,
              money AS 金币, reputation AS 声望, clinic_level AS 医馆
       FROM users LIMIT 10;"
    echo ""
    echo "=== 📊 统计 ==="
    echo "用户总数: $(sqlite3 "$DB" "SELECT count(*) FROM users;")"
    echo "存档总数: $(sqlite3 "$DB" "SELECT count(*) FROM game_data;")"
    echo "总金币:   $(sqlite3 "$DB" "SELECT coalesce(sum(money),0) FROM users;")"
    echo "平均等级: $(sqlite3 "$DB" "SELECT coalesce(round(avg(clinic_level),1),0) FROM users;")"
    echo "总已读:   $(sqlite3 "$DB" "SELECT coalesce(sum(read_count),0) FROM users;")"
    echo ""
    echo "=== 前5名金币榜 ==="
    sqlite3 -column -header "$DB" \
      "SELECT row_number() OVER (ORDER BY money DESC) AS '#',
              CASE WHEN nickname IS NOT NULL AND nickname != '' THEN nickname ELSE substr(phone,1,3)||'****'||substr(phone,7) END AS 玩家,
              money AS 金币
       FROM users ORDER BY money DESC LIMIT 5;"
    ;;
  delete)
    phone="$2"
    if [ -z "$phone" ]; then
      echo "❌ 请指定手机号，例如: bash db.sh delete 13800138001"
      exit 1
    fi
    echo "⚠️  即将删除用户 ${phone} 的所有数据（不可恢复！）"
    echo "═══════════════════════════════════════════════════"
    sqlite3 "$DB" "DELETE FROM game_data WHERE phone = '${phone}';"
    sqlite3 "$DB" "DELETE FROM users WHERE phone = '${phone}';"
    echo "✅ 已删除 ${phone}"
    ;;
  sql)
    shift
    if [ -z "$*" ]; then
      echo "请输入 SQL，例如: bash db.sh sql \"SELECT * FROM users WHERE money > 1000;\""
    else
      echo "🎯 执行: $*"
      echo "═══════════════════════════════════════════════════"
      sqlite3 -column -header "$DB" "$*"
    fi
    ;;
  *)
    echo "岐黄问道录 — 数据库工具"
    echo "═══════════════════════════════════════════════════"
    echo "用法: bash db.sh [命令] [参数]"
    echo ""
    echo "  bash db.sh             🏆 排行榜（默认前20）"
    echo "  bash db.sh rank 10     🏆 排行榜（前10）"
    echo "  bash db.sh users       👥 所有用户（含字段说明）"
    echo "  bash db.sh user 手机号  🔍 查某个用户详情"
    echo "  bash db.sh schema      📐 数据库表结构"
    echo "  bash db.sh all         📊 完整统计"
    echo "  bash db.sh delete 手机号  🗑️ 删除用户及其所有数据"
    echo "  bash db.sh sql \"SQL\"  🎯 执行自定义 SQL"
    ;;
esac
