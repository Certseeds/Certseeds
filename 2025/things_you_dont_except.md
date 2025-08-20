---
author: "Certseeds"
date: "2025-08-20"
lastmod: "2025-08-20"
title: "那些没预料的事"
description: "列举那些和直观不符的事情"
tags: ["notes", "experience"]
---

# 那些没预料的事

> 灵感来自 hacker news 上的某个帖子

+ 2025-08-20: <https://www.npmjs.com> 虽然网页上不显示注册邮箱(令人奇怪的是, cnpm上直接就能在账户页看到), 但却会将其放到包的*元数据*中, 参考 [官方文档](https://docs.npmjs.com/creating-a-new-npm-user-account/), `npm view vue` 这样操作一下就能看到.
  + 修复方式: npmjs上更新邮箱再发个新版本, 镜像站就会同步一次, 邮箱会被刷掉.
