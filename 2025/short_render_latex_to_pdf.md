---
author: "Certseeds"
date: "2025-06-09"
lastmod: "2025-06-14"
title: "将markdown+latex渲染为pdf"
description: "render markdown with latex to pdf"
tags: ["notes", "experience", "js"]
---

## 将markdown+$\LaTeX$渲染为pdf

昨天完成了awesome-exams-page的重要功能更新, 实现了使用pandoc将markdown+latex渲染为pdf的功能, 现在每一个整理好的html页面都会对应一个pdf文件, 可以在页面上直接点击下载.(虽然没校对好的也有)

第一次渲染发现有21个页面的渲染失败, 主要是因为写法问题, pandoc+latex更严格

1. `\left` `\right` 如果不需要括号, 需要写成 `\left.` `\right.`
2. 不能使用`\boldsymbol{v}`, 不支持`\boldsymbol`
3. 需要将 `\begin{array}{ccc|c}`里面的cc数量对齐, 下面每一行有x个&, 这里就得有 x+1个c
4. `\begin{array}{ccc:c}`里面不能用`:`, 只能用`|`
5. 不能使用 `\tag{}`, 建议用 `\quad \quad \quad (1)`
6. ~~不推荐使用`\left(`, `\right)` 建议替换为 `(`, `)`~~, `\left(` 对`\begin{array}`等场景下依然不可取代, 其他场景可以替换
7. `\right\rvert\` 替换为 `\right|`

都替换完成后pdf的渲染效果可以达到目标了, 体积比对html还有优势, 这确实是意外之喜.

还发现一些小问题:

1. latex即使是在四美元符号之间, 也最好不要向内加入 `\text{中文字符}`, 加了xeCJK也会随机弹出warning, 附带收获一个白框
2. 四美元符号之间最好不要带空格, 最多加一行`\quad`分割一下

备注: 还是得在本地复现, 完成目标的速度和获取测试结果的速度成正比.
