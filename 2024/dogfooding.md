---
author: "Certseeds"
date: "2024-12-17"
title: "dogfooding"
description: "自己发布库自己使用实在是太棒了"
tags: ["frontend", "fonts", "icon"]
---

# dog fooding

> 因为我是个科学家, 因为我以发明, 改造, 创造和毁灭为生, 只要我不喜欢这个世界的某些部分, 我就去改变它.
>
> Rick

近期发现了 `https://github.com/Warhammer40kGroup/wh40k-icon`; bilibili上的一位up主在更新icon方面的材料, 以及<https://trcepo.com>上面的图标库, 看github上有一段时间没更新了, 于是决定fork来开发一下.

## 工具与资源

原始仓库中有大概100来个图标, 分类很草率, 于是拿到图标包之后按图标进行了重分类, 基本上是按阵营分, Imperial, Chaos, Xenos, 分不出来的都划分到General里面

重构阶段就会发现, 虽然是按阵营分, 但是阵营内部仍然可以细分, 或者说只要图标多了就可以从中聚出一个新类别来, 好几个`angels-of-xxx`就可以被归类到`chapters`下面, 之后如果有了U团的图标, 还可以把它们下分到`chapters/da`下面.

一开始使用的库是webfont, 这个库可以说现在已经僵尸化了 <https://github.com/itgalaxy/webfont>

+ 首先是npmjs上和github上版本不对应, github上面有 11.38, 11.3.0, 11.4.0 ; 但是npmjs上最新版本只有11.2.26.
+ 其次, 越升级版本构建出来的体积越大, 8.2.1和9.0.0版本构建出的体积, 对比11.2.26构建出的体积能小一半.
+ 高版本构建出来的woff2字体文件, 还可以看出来构建进去了不少奇怪的icons, 名字只有大小写字母和数字, 怪得很.

随后迁移到了svgtofont, 这个包有人维护体验不要太好, 作者能很坚决的否定没有必要的功能, 并在非常快的时间内予以回复, 并且也不拒绝合理的文档更新. (虽然库内有些代码风格比较老旧, 在将最低版本要求限制到node18之后其实可以rewrite一把优化阅读代码体验的.)

在处理up主产出png的过程中, 一直在用imageMagick转换图标为pnm格式, 送入potrace来将其自动转换为svg格式, 并结合inkscape的`--export-plain-svg`手段做过滤, 最后用xmllint格式化, 但是问题在于inkscape总是会加入一些多余的attributes, xmllint格式化也不怎么样, 之后看下有没有nodejs的解决方案. (DONE, svgo虽然确实有效, 但是有些图片处理之后无法再被svg2font处理, 不再进行尝试)

拿到svg之后还可以用采色器摘取png的颜色, fill到svg的每一个path里面, 不过这也是有局限的, 如果svg里面一个path和图像的一部分不对应就不行了, 只能保持黑色了. 尝试过可视化编辑的就能感受到, 一个一个的使用inkscape来处理太消耗时间了, 不是一个合适的解决方案.

## 发版与吃狗粮

在构建好基础的一些图像之后, 为了方便预览/debug, 为仓库搭建了gh-pages, 不得不出这个决定很正确, 可视化的构建能够帮助元数据文件的测试, 并且也辅助支撑了vue-example的撰写, 现在pages上有一个纯svg的加载页面, 一个纯webfont的加载页面, 每个目录meta.json还对应一个页面, 成就感up up.

构建完成后测试了一把GitHub package npm的构建, 现在最大的问题在于: GitHub package npm将自己定位成一个 "private" 的npm源, 在使用时无论源package是public/private, 都得用token/login in了再开发, 这搞得actions里面拉取个包还得登录?? 而且官方给的允许public-read的方法居然是把自己的token放仓库里, 这gh-npm完全比不上ghcr.io.

看清楚gh-npm的本质之后, 迅速切换到了npmjs来发布, 没想到npmjs发布后居然是npmmirror先能看到页面, 然后npmjs上面的包才能看到, 这个过程得有15分钟往上, 好在两边包都能下载.

虽然dog-food好, 但是直接自己引用自己我看也不是什么好主意, 于是用vitebooks来dog-food了一下, 展示了一下woff2以及svg的使用, 添加到依赖中后就可以在md中使用, 爽! 后续预计depage页面 以及每本书的主页都会添加一些图标, 还可以探索一下如何在pandoc生产epub过程中也添加一些进去(甚至添加部分vue代码进去?)

woff2等字体的问题包括不支持颜色, 不支持tree shaking优化, 文件大, 加载后渲染需要等待css以及字体都加载才能渲染出来等, 但是如果用得多确实是体积小, 340个svg加起来有1200k, 但是woff2自己只有120k左右.

## feature

未来wh40k-icon库还会继续维护, 从web资源中清洗更多icon, 从up的专栏中转换部分icon, 很小概率会有自己画的icon, 乃至于提供一些工具. 但是发版估计很长时间都会是大版本号0版本.
