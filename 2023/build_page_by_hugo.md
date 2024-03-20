---
author: "Certseeds"
date: "2023-02-14"
title: "hugo github-pages搭建博客"
description: "build page by hugo"
tags: ["go", "frontend", "hugo"]
---

# hugo github-pages搭建博客

为了更美观的展示文章, 近期搭了个博客, 记录一下全过程.

## 搭建方式

参考ruanyifeng在2023年2月17日的科技爱好者周刊<https://www.ruanyifeng.com/blog/2023/02/weekly-issue-242.html>,关于博客的建议.

> 这次的教训有很多，如果大家也想做一个独立博客，我有两点建议。
>
>（1）不要自己管理服务器。 服务器管理是一个非常繁琐的专门工种，如果不是专业的运维工程师，很难做好。退一步说，即使你拥有这方面的专业知识，也不值得把大量时间和精力投入在自己的博客服务器上。网络世界是一个黑暗森林，到处都有人向你打冷枪，防不胜防，解决方法就下一条。
>
>（2）使用专业的云服务商。 现在大部分云服务器商，都有静态网站托管服务，把静态网页托管在它们那里，省时省心。如果你需要后端动态生成内容，那就使用云函数（叫做 FaaS），通过服务商提供的边缘计算、而不是你的主机自带的 CPU 算力。

因此肯定是搭建一个静态网站, 本地只负责源文件, 操作触发流水线, 产出静态网站之后部署上去.

由于仓库托管在github上, 因此采用github-actions+github-pages的方式来实现.

## 考虑因素

### 不改变原始结构

jekyll, hexo, hugo这些静态站点构建工具都会约定一个目录来存放源文件, 有些是`posts`,有些是`content`, 反正是没有直接扫描markdown的, 在这样的子目录里存放文章, 对仓库的第一印象有伤害, 无法直截了当的给人整体结构的印象.

我希望能够保持文件夹的原始结构, 尽量不改变, 让读者,也让自己能够更直接的看清目录结构, 进行编辑.

### 便于调试

由于github-actions整个运行在远端服务器上, 没法连上去调试, 所以得找一个跨平台使用起来体验比较一致的, 提前预防各种怪问题.

jekyll基于ruby, hexo基于nodejs, hugo基于go, 跨平台使用难度依次递减.

+ 很难想象如何在windows上配置ruby这样一门陌生的语言.
+ nodejs又有些太繁琐, 不想在仓库里面存一个巨大的依赖目录.
+ 依托于go语言对跨平台的包装和对静态文件的支持, hugo的下载安装,运行使用就比较简单, 基本上scoop拖下来就能用.

## 选择

综合上面两个因素, 最终选定hugo(-extend)作为静态站点构建工具, 使用scoop把它拖到本地, 开始测试.

### 搭建最小可执行用例

这部分开始前,先读了读<https://gohugo.io/getting-started/> , 看了下文件夹架构和变量替换的文档, 得出结论: 变量替换不太好用, 正文里最好不要和它打交道, 原样把markdown转成html就够了.

随后, 参考<https://themes.gohugo.io/>提供的清单, 一眼选中papermod, 开始了解这个主题.

<https://github.com/adityatelange/hugo-PaperMod/> , 这个仓库把另外一个分支当作源, 从而实现一个仓库即是依赖, 也用自己来构建网站.

因此, 直接拉取该分支, 本地`hugo server`启动,查看`localhost:1313`

这之后就是简单的动手实验环节, 通过hugo快速的刷新功能, 搞清楚每一个配置项, 每一个目录, 每一个文件对仓库造成的影响.

### 构建

简单添加一个构建流水线

+ 拉取目录
+ 添加hugo缓存, 以go.sum的hash来判断是否更新了子目录
+ install extend-hugo
+ move folder to posts
+ move single markdown to posts
+ 自定义archives, search页面
+ build
+ 向build出来的目录内部添加一个public.key
+ 将其上传为artifact, 以供调试, 以及下一个环节使用

由于需要部署, 需要对pages的write权限, 用于鉴定可信源的id-token权限, 固定的environments-url, 最后使用deploy-pages进行一键部署.

## 弊端-好处

使用静态网站构建有好有坏.

### 弊端

用静态站点就必须要依赖一些第三方的链接/文件/请求来分析数据, 比如GA,BaiduADs. 出于GDPR合规考虑, 直接把他们都去掉的情况下, 基本上就没有什么可以分析的了, 两眼一抹黑.

github-pages没法自定义url, 导致SEO优化不太好做. 由于并不想用`github.io`这种名字来创建仓库, 而且希望共享README和文档, 到最后部署成功的目录后面带有一个默认的仓库名`Certseeds`, 直接导致整个页面很难被google这种搜索引擎抓取到, 就算是有robots.txt也没用... 搜索引擎由于没法从`${username}.github.io`下面抓到roadmap, 干脆就不读了...

### 好处

+ 维护方便, 不需要自己操心服务器,DDOS,CNAME之类的了, 推送之后自动部署更是大幅度节约时间.
+ 添加友链方便, 可以把其他仓库的github-pages链接起来, 方便推广使用.
