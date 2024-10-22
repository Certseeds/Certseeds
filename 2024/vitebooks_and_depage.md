---
author: "Certseeds"
date: "2024-10-20"
title: "vitebooks_and_depage"
description: "vitepress建站以及依赖项页面"
tags: ["frontend", "rust", "book"]
---

# vitepress建站以及构建依赖页面

本文主要围绕[vitebooks仓库](https://github.com/Certseeds/vitebooks)及其页面[vitebooks-gh-pages](https://vitebooks.certseeds.com/), 写一下搭建过程.

## 起因

在10月份, 在某个论坛中找到了一份warhammer系列的译文压缩包, 内部包括几乎完整的荷鲁斯叛乱系列小说翻译, 整理之后除了到处都有的荷鲁斯崛起-伪神-燃烧的银河三部曲之外, 几乎全部是txt文件, txt文件也不是不能阅读, 但是测试之后发现, 在PC端使用"记事本"打开的阅读体验非常差, 用vscode打开的体验也难分伯仲. 因此希望在阅读的过程中, 一边读, 一边将其从txt文件转化为markdown文件, 以便后续查验.

新开一个文件夹之后, 初始化了git仓库, 这种文本类项目就应该加入版本管理. 当markdown拆分结束后, 发现在vscodeo中阅读黑色背景的小说有点难以接受, 就使用vitepress来提供将markdown转换成静态页面,一不做二不休, 顺便将其发布到pages上, 于是就有了[vitebooks](https://vitebooks.certseeds.com/). github pages的总大小上限是1G, 按当前容量测算大概1本书0.5-1M, 绝对能把荷鲁斯叛乱系列都放进去.

在论坛上多逛一下, 发现了另一个回复, 内部包括电子书原文归档, 还额外包括一张图, 包括大部分书的依赖关系, 比如无所畏惧前置推荐阅读深渊之战, 军团以及异端初现三本, 整个是一张有向无环图. 据此准备在阅读过程中, 除了markdown的转化, 还要进行meta.toml的编写, 以便后续处理.

meta.toml的介绍可以参考<https://vitebooks.certseeds.com/warhammer40k/dependencies>; 除了原文之外, 每本书还包括一个organize.md, 用于介绍书籍组织结构; 一个meta.md, 放置一些元数据, 比如译者, 整理者, 原始平台URL等; 一个base.md, 用来放置序章, 副标题, 简介以及人名等信息.

## goserver

页面构建好之后, github-actions会发布dist目录到pages中, 并且还会将dist发布到actions中的临时产物内, 为了方便本地渲染, 就用go随便写了个server, 用于提供dist目录的静态服务, 没想到只用几十行代码就能写出一份读取配置文件和端口, 提供http服务的exe, go的标准库真是好用.

## depage

在编写了meta.toml后, 很明显, 这个文件内部的元数据不仅仅可以供人工阅读, 还可以让代码来解析, 以便生成更多的页面, 于是就有了depage子页面.

### rustydep

近期翻到不止一次rust-wasm的信息, 因此决定这次拿rust-wasm来试水, 据说rust在target为wasm时工具链很好用, 因此使用rust初始化了rustydep项目.

由于rust和js之间的交互耗费性能, rust-wasm的导出函数中一般除了输出和输入之外, 内部没有和js的交互; 再加上跨语言的bind问题, rust中的结构体得额外加入一些tag来和js端的数据结构对应, 还不如输入是Uint8Array, 输出是一个json来的简单.

rust的编译器虽然可以编译出wasm-unknown-unknown的package, 但是缺乏js的辅助包, 除非喜欢自己手写声明wasm内存和指针, 要不就得用wasm-pack来辅助编译, 这也就导致dev-dependencies中包括wasm-pack以及wasm-bindgen-cli. 而依赖包也需要斟酌, 比如zlib等一些包, 由于内部问题, 无法在wasm-un-un平台上编译, 平常调试看不出来, wasm-pack一编译就能看出来了. 由于这种包很可能也被wasm-pack所依赖, 当wasm-pack构建成功, 自己的包构建失败时, 可能一时半会想不出问题在哪里: wasm-pack的binary不需要参与到目标产物生成中, 其实是x86的target, wasm-pack的x86-binary调用cargo生成库的wasm的binary, 自己不会和库链接到一起.

PS: 也许这是阻止在wasm中编译wasm包的一种尝试?

至于rust的编译, 现在感觉由于只有函数级别交互, 似乎不能导出一个变量, 让他先初始化以供后续调用这种oop式的写法, 函数之间都需要拆的比较开; 生命周期问题也没什么好说的, 由于大多数struct读完都不修改, 加入clone就能解决大多数问题(但是还是希望能够标记struct为const).

测试方面也很顺利, 在x86下测试好之后, 在web端运行就没有问题, 体验很好!

### depage本身

最初希望在vitebooks本项目内引入wasm模块, 但是由于不太希望vitebooks引入vue, 就拆分出了depage子页面, 分开构建, 在build出dist后, 将子页面的dist复制到vitebooks的dist中, 一起发布, vitebooks自己跳转depage时用新页面的方式, 防止vitepress路由冲突.

depage主要引用了rustydep的wasm模块, 用于解析meta.toml生成的压缩包meta.tgz, 由于wasm的特性, 生成的页面可以在浏览器中运行, 以提供书名到多级前置阅读的转换; 话是这么说, 但是这个引入过程实在一波三折.

初学者可能会参考<https://developer.mozilla.org/en-US/docs/WebAssembly/Rust_to_Wasm>, 这是一个很好的example, 能够在本地搭建起wasm-pack的编译链条, 并且最后构建出一个webpack打包的静态页面, 但是问题在于, 这里只有webpack打包, 并没有提供vite中如何打包.

在阅读<https://www.rust-lang.org/zh-CN/what/wasm>, <https://rustwasm.wasmdev.cn/docs/book/game-of-life/hello-world.html>, <https://github.com/rustwasm/wasm-pack>以及<https://rustwasm.wasmdev.cn/docs/wasm-pack/quickstart.html>之后, 你会发现 wasm-pack现在主要推荐使用`wasm-pack build --release --target web`的构建方式, 但是webpack似乎和原始的方式(不加参数, 默认为bundler)适配的比较好, 现有demo也比较多. 在github上搜索也会发现vite-wasm项目实在不多.

但是, 实际上wasm-pack构建出的web-target可以被vite直接引用, 在编译好pkg, 并指定相对路径后, `pnpm install`后它会被link到node_modules下, 之后观察目录结构.

``` log
$ tree
.
├── package.json
├── rustydep.d.ts
├── rustydep.js
├── rustydep_bg.wasm
└── rustydep_bg.wasm.d.ts
```

显然,

+ package.json提供了被引用的能力
+ rustydep_bg.wasm就是模块本体
+ rustydep_bg.wasm.ts看起来是就不是让直接调用的, 实际上是原始wasm的函数声明, 里面参数都是number.
+ rustydep.js && rustydep.d.ts这一对则提供直接的对外调用能力, [wasm-bind]的函数也都出现在这里, 并且输入输出参数正常.

经过一小段时间调试后, 结合vue提供的`${package}/${static_resource}?url`的相对路径寻址能力, 就可以在vue中加载wasm模块了, 当然唯一的问题在于加载出来后, 调用rustydep.initSync函数的返回值有点奇怪, 和rustydep_bg.wasm.ts内部的函数有重复, 忽略后会发现调用rustydep内部的导出函数即可.

按照c++的角度来类比, wasm文件就是so文件, 而rustydep.d.ts则是高级头文件, rustydep.js算是高级头文件对应的桥接代码, rustydep_bg.wasm.d.ts是低级头文件, 高级头文件的桥接代码将高级头文件的函数调用对接到低级头文件上.

加载完模块后, vue负责将URL转化为tgz包, 再转换成tar包, rustydep吃掉tar流, 输出一个json, 之后vue将其渲染出来; 未来wasm还可以导出tgz生成书名列表, 书名-toml表等函数.

## 文字处理

起初准备一开始就用node脚本来处理文本, 之后感觉有些不值当, 也许每本处理耗时非常少呢? 于是就手动处理了, 拆着拆着, 发现手动真麻烦, 辅助脚本就此出现, 处理了五本之后感觉差不多足够了.

辅助脚本会按公共逻辑执行大部分操作, 一些判别函数和字符串从书中的module.js中动态加载.

首先是要进行拆分, 小说内章节分的还挺清楚, 一般会有明显的 `1 2 3`, `第一章 第二章`提示, 因此可以用这个作为新章节的分割点, 将一个大txt转换为多个markdown.

随后要进行一些替换, 出于个人喜好, 将中文标点替换为英文标点, 并按照一定规则为其添加空格, 随后为多本之间更连贯的阅读体验, 将原体名, 人名, 专有名词等统一替换为一份译名. 替换表通过symbol.json和names.txt来提供. names.txt计划用vitepress的插件转写到meta.md最后, 动态生成人名表.

最后要添加页面头部的相对链接, 以便在vitebooks中能够前后跳转.

未来还计划使用llm对文本进行分析, 从句子中提取出所有的人名来, 对其向量化之后聚类, 以此来寻找常见的多字/少字/错字/翻译错误等问题.

## 结语

这个项目还会持续一段时间, 直到清洗完足够的文本.
