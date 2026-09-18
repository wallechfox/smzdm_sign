#!/usr/bin/env node
/**
 * smzdm_sign - 什么值得买 App API 自动签到
 * 纯 JS · 零依赖 · Node.js 直接运行
 * https://github.com/wallechfox/smzdm_sign
 *
 * 环境变量:
 *   SMZDM_COOKIE_LIST   cookie列表，多账号用 |=| 分隔
 *   QYWX_KEY            企业微信机器人 webhook key（可选）
 */

const https = require("https");
const crypto = require("crypto");
const querystring = require("querystring");

const COOKIE_LIST = (process.env.SMZDM_COOKIE_LIST || "")
  .split("|=|").map(c => c.trim()).filter(Boolean);
const QYWX_KEY = process.env.QYWX_KEY || "";

const APP_KEY = "apr1$AwP!wRRT$gJ/q.X24poeBInlUJC";
const APP_SK = "ierkM0OZZbsuBKLoAgQ6OJneLMXBQXmzX+LXkNTuKch8Ui2jGlahuFyWIzBiDq/L";
const APP_VERSION = "10.4.1";
const APP_UA = "smzdm_android_V10.4.1 rv:841 (22021211RC;Android12;zh)smzdmapp";
const HOST = "user-api.smzdm.com";

function now() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function md5Upper(s) {
  return crypto.createHash("md5").update(s, "utf8").digest("hex").toUpperCase();
}

function isOk(code) {
  return code === 0 || code === "0";
}

function getUser(ck) {
  return ck.split(";")[0].slice(0, 16) + "...";
}

function postForm(path, dataObj, cookie) {
  return new Promise((resolve, reject) => {
    const body = querystring.stringify(dataObj);
    const req = https.request({
      hostname: HOST, port: 443, path, method: "POST",
      headers: {
        Host: HOST,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": APP_UA,
        Cookie: cookie,
        "Content-Length": Buffer.byteLength(body),
      }
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("timeout")); });
    req.write(body);
    req.end();
  });
}

async function push(msg) {
  if (!QYWX_KEY) return;
  const body = JSON.stringify({ msgtype: "text", text: { content: msg } });
  const req = https.request({
    hostname: "qyapi.weixin.qq.com", port: 443, method: "POST",
    path: `/cgi-bin/webhook/send?key=${QYWX_KEY}`,
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }
  }, res => res.resume());
  req.on("error", () => { });
  req.write(body);
  req.end();
}

// 从 checkin 响应里解析账户信息
function fmtCheckinData(json) {
  const d = json.data || json;
  const lines = [];
  if (d.daily_num != null) lines.push(`🔥 连续签到: ${d.daily_num} 天`);
  if (d.cgold != null) lines.push(`🪙 金币: ${d.cgold}`);
  if (d.pre_re_silver != null) lines.push(`🥈 碎银: ${d.pre_re_silver}`);
  if (d.cpoints != null) lines.push(`⭐ 积分: ${d.cpoints}`);
  if (d.cexperience != null) lines.push(`📈 经验: ${d.cexperience}`);
  if (d.cards != null) lines.push(`🎫 补签卡: ${d.cards}`);
  if (d.rank != null) lines.push(`🏅 等级/排名: ${d.rank}`);
  return lines;
}

async function getRobotToken(cookie) {
  const ts = Date.now();
  const sign = md5Upper(`f=android&time=${ts}&v=${APP_VERSION}&weixin=1&key=${APP_KEY}`);
  const text = await postForm("/robot/token", {
    f: "android", v: APP_VERSION, weixin: "1", time: String(ts), sign
  }, cookie);
  const json = JSON.parse(text);
  if (!isOk(json.error_code)) throw new Error(`token失败: ${json.error_msg || text.slice(0, 100)}`);
  return json.data.token;
}

async function doCheckin(cookie, token) {
  const ts = Date.now();
  const sign = md5Upper(`f=android&sk=${APP_SK}&time=${ts}&token=${token}&v=${APP_VERSION}&weixin=1&key=${APP_KEY}`);
  const text = await postForm("/checkin", {
    f: "android", v: APP_VERSION, sk: APP_SK, weixin: "1", time: String(ts), token, sign
  }, cookie);
  return JSON.parse(text);
}

async function main() {
  console.log(`[${now()}] 开始签到，共 ${COOKIE_LIST.length} 个账号\n`);

  if (!COOKIE_LIST.length) {
    console.error("未配置 SMZDM_COOKIE_LIST");
    process.exit(1);
  }

  const results = [];

  for (let i = 0; i < COOKIE_LIST.length; i++) {
    const cookie = COOKIE_LIST[i];
    const user = getUser(cookie);
    console.log(`[${now()}] (${i + 1}/${COOKIE_LIST.length}) ${user}`);

    const delay = 1000 + Math.random() * 4000;
    await new Promise(r => setTimeout(r, delay));

    try {
      const token = await getRobotToken(cookie);
      console.log(`  ├─ token OK`);

      const checkinJson = await doCheckin(cookie, token);
      if (!isOk(checkinJson.error_code)) {
        throw new Error(`签到失败 code=${checkinJson.error_code} msg=${checkinJson.error_msg || "(空)"}`);
      }

      console.log(`  ├─ ✅ 签到成功: ${checkinJson.error_msg || ""}`);

      // 直接从 checkin 响应解析账户信息
      const infoLines = fmtCheckinData(checkinJson);
      infoLines.forEach(l => console.log(`  ├─ ${l}`));

      const msg = `✅ 什么值得买签到成功\n用户: ${user}\n时间: ${now()}\n${checkinJson.error_msg || ""}\n${infoLines.join("\n")}`;
      results.push({ user, ok: true });
      push(msg);

    } catch (e) {
      console.log(`  └─ 💥 ${e.message}`);
      results.push({ user, ok: false });
      push(`❌ 签到失败\n用户: ${user}\n时间: ${now()}\n${e.message}`);
    }
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`[${now()}] 执行完毕`);
  const okCount = results.filter(r => r.ok).length;
  console.log(`成功: ${okCount}/${COOKIE_LIST.length}`);
  results.forEach(r => {
    console.log(`  ${r.ok ? "✅" : "❌"} ${r.user}`);
  });
}

main();