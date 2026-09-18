# smzdm_sign

什么值得买（SMZDM）自动签到脚本 —— 纯 JavaScript · 零依赖 · Node.js 直接运行。

基于什么值得买 App API 通道（`user-api.smzdm.com`），不走网页端，避免 `110202` 验证码风控。

## 特性

- 🟢 **零依赖** — 仅使用 Node.js 内置模块（`https` / `crypto` / `querystring`）
- 📱 **App API 通道** — robot/token → checkin，签名校验，稳定可靠
- 🔔 **企微推送** — 签到结果通过企业微信机器人通知（支持多账号）
- 👥 **多账号** — 环境变量配置，支持多账号轮询，随机延迟防风控
- 🐳 **容器友好** — 飞牛 NAS 白虎 / 青龙面板 / Docker / 群晖 均可部署
- 📊 **详细输出** — 连续签到天数、金币、碎银、积分、经验、补签卡一目了然

## 快速开始

### 方式一：直接下载单文件（推荐青龙/面板用户）

```bash
# 官方 raw 链接
wget -O smzdm_sign.js https://raw.githubusercontent.com/wallechfox/smzdm_sign/main/smzdm_sign.js

# 或使用 curl
curl -o smzdm_sign.js https://raw.githubusercontent.com/wallechfox/smzdm_sign/main/smzdm_sign.js
```

**青龙面板用户**：在「脚本管理」中新建文件，上传 `smzdm_sign.js` 或通过「远程仓库」订阅本仓库。

### 方式二：Git Clone（适合开发者 / 想持续更新）

```bash
# 官方
git clone https://github.com/你的用户名/smzdm_sign.git

# 国内镜像 clone（gitclone.com）
git clone https://gitclone.com/github.com/你的用户名/smzdm_sign.git

# 或搭配 ghproxy 加速
git clone https://ghproxy.com/https://github.com/你的用户名/smzdm_sign.git
```

### 方式三：青龙面板远程订阅

在青龙面板「订阅管理」中添加：

- 仓库地址：`https://github.com/wallechfox/smzdm_sign`
- 分支：`main`
- 文件类型：`smzdm_sign.js`

## 配置

### 环境变量

| 变量                | 必填 | 说明                                     |
| ------------------- | ---- | ---------------------------------------- |
| `SMZDM_COOKIE_LIST` | ✅    | Cookie 列表，多账号用 `\|=\|` 分隔       |
| `QYWX_KEY`          | ❌    | 企业微信机器人 webhook key，用于推送通知 |

### 获取 Cookie

1. 浏览器登录 https://www.smzdm.com
2. 打开开发者工具 → Network → 任意请求 → 复制 `Cookie` 请求头
3. 粘贴到 `SMZDM_COOKIE_LIST` 环境变量中

> **提示**：网页 Cookie 通常可用，但如需更高稳定性，建议抓包 App 端 `user-api.smzdm.com` 的请求 Cookie。

## 运行

```bash
# 直接运行
node smzdm_sign.js

# 指定 Node 版本（如飞牛 NAS 白虎）
mise exec node@23.11.1 -- node smzdm_sign.js

# 环境变量示例
SMZDM_COOKIE_LIST="cookie1|=|cookie2" QYWX_KEY="你的企微key" node smzdm_sign.js
```

### 定时任务（cron 示例）

```bash
# 每天早 8:10 执行
10 8 * * * cd /path/to/smzdm_sign && node smzdm_sign.js >> sign.log 2>&1
```

## 运行效果

```
[2026-09-10 10:00:00] 开始签到，共 1 个账号

[2026-09-10 10:00:00] (1/1) __ckguid=...
  ├─ token OK
  ├─ ✅ 签到成功: 已签到
  ├─ 🔥 连续签到: 30 天
  ├─ 🪙 金币: 1000
  ├─ 🥈 碎银: 300
  ├─ ⭐ 积分: 40
  ├─ 📈 经验: 10
  ├─ 🎫 补签卡: 1
  ├─ 🏅 等级/排名: 1

========================================
[2026-09-10 10:00:03] 执行完毕
成功: 1/1
  ✅ __ckguid=...
```

## 致谢

- https://github.com/Sitoi/dailycheckin — App API 签到通道与参数签名思路
- https://github.com/charmingYouYou/smzdm_sign_ql — 早期签到脚本参考

## 更新日志

- **v1.0** (2026-09-18) — 初版发布，App API 通道，零依赖，支持企微推送，连续签到信息展示

## 免责声明

本脚本仅供学习交流与个人使用，禁止用于商业用途或违反网站服务条款的行为。使用本脚本产生的任何后果由使用者自行承担。

## License

[MIT](LICENSE)
