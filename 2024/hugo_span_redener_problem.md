---
author: "Certseeds"
date: "2024-07-21"
title: "hugo post-meta redener problem"
description: "解决hugo post-meta渲染问题"
tags: ["blog", "frontend"]
---


# 解决hugo post-meta渲染问题

最近发现blog中post-meta部分渲染有些问题.

预期本来应该是这样

``` html
<div class="post-meta">
    <span title="1996-12-20 00:00:00 +0000 UTC">1996 December 20</span>
</div>
```

但是构建之后却是这个效果

``` html
<div class="post-meta">
    &lt;span title='1996-12-20 00:00:00 +0000 UTC'&gt;December 20, 1996&lt;/span&gt;
</div>
```

像'<', '>'这样的符号都被转义了, 导致post-meta中的html渲染不出来, 成了纯文本. 到底是什么问题?

看起来是个papermod的[bug](https://github.com/adityatelange/hugo-PaperMod/issues/1344), 修复提交在[7795c90f6fa106733267481d9ed0518b00f2c62c](https://github.com/zer0ttl/hugo-PaperMod/commit/7795c90f6fa106733267481d9ed0518b00f2c62c), 这个变更应该是来自hugo [v0.120.0](https://github.com/gohugoio/hugo/releases/tag/v0.120.0)的修改,

issue [#10876](https://github.com/gohugoio/hugo/issues/10876), [#11502](https://github.com/gohugoio/hugo/issues/11502)分别报告了Delimit函数的返回值问题, 它在文档中报告返回string, 但是返回的是一个template.HTML, 所以在v0.120.0中被修复掉.

v0.120.0发布时间是2023-10-30, 影响时间八个月.
