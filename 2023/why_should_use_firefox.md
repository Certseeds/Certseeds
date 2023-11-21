---
author: "Certseeds"
date: "2023-06-03"
title: "why_you_should_use_firefox"
description: "使用firefox也是给free-software做贡献"
tags: ["open-source", "notes", "experience"]
---

# 为什么应该开始使用firefox

先来一段引文

> The overwhelming majority of changes to Guava don't add new features at all. Optimizations, tests, documentation, refactorings -- these are all part of making Guava meet the highest standards of code quality and usability.
>
> Contributing improvements in these areas is much easier, and much less of a hassle, than contributing code for new features.
>
> Just email the mailing list with a summary of the improvements you'd like to make and why, and ask for a reviewer. If the community agrees that it's a good change to make, code up the change and send it to your reviewer as above. There's no need to write a feature request or anything.guava-discuss

这段文本出自`google/guava`的HowToContribute, Googler表示大多数时间在仓库里的提交都没有添加新功能, 只是文档, 优化, 测试, 重构..., 再放大一些, 复现社区bug提供最小复现demo, 参与讨论, 关闭issue, 检阅pr也都是贡献.

除此之外, 对于Mozilla Foundation这种非营利组织来说, 使用就是一种支持.

## 使用者, 盈利与竞争对手

firefox作为一个浏览器, 免费在网上供人下载, 还提供(一些软件pro版本才提供的)自动更新功能, 他们从哪里盈利?

他们与Google达成了合作, firefox将google设置为默认搜索引擎, google每年支付4亿刀左右.

firefox的装机量(非使用量)大概在2亿, 平均下来google给一个使用量2刀左右的推广费, 考虑到Thunderbird也是他家的应用, 感觉这俩完全可以联动, 把同时使用作为捐款, 一刀两刀就别捐了, 直接下载firefox就好.

浏览器赛道上还有另一位选手, Brave先是推广浏览器, 然后开始造搜索引擎, 很奇妙的是: 它们会用浏览器的数据来喂给搜索引擎用, 感觉到一丝从google搜索引擎里面搞数据蒸馏的感觉, 以及靠用户的浏览来实现"爬取"操作, 很巧妙.

## 备份,user.js and pref.js的关系

firefox 可以通过配置文件配置一大串功能, 其他浏览器或者是在需要在界面中点点点, 或者说是需要打开注册表, 配置一大溜`key: value`. 更棒的是, 配置文件有优化好的标准模板[arkenfox/user.js](https://github.com/arkenfox/user.js), 只要在此基础上进行少量配置, 即可获取安全的网络浏览.

### user.js && pref.js

user.js会在启动时被firefox读取, 复合一些其他配置后, 最终会写入到prefs.js中, 形成一个运行期间不变, 每次close/open都会变的文件.

由于user.js处理过程中, 相同的key按最后一个为准, 要覆盖配置的话, 不需要对标准模板进行修改, 只需要在最后附加上新的配置项即可. 这就给保存模板带来了很大的方便, 可以把不变的部分和可变的部分拆来开保存.

### 备份

firefox的配置完全保存在profiles文件夹中(不过不一定叫这个名字), 可以通过一些简单的操作, 来实现迁移firefox的所有配置.

参考 <https://support.mozilla.org/zh-CN/kb/%e5%a4%87%e4%bb%bd%e4%bd%a0%e7%9a%84%e4%bf%a1%e6%81%af>

1. 保存原有配置
2. 创建一个新的配置文件, 把目录选定好(因为firefox的一些配置文件内有最深一层的文件夹名); 然后退出
3. 把原有配置的所有文件都复制进新配置目录
4. 打开firefox-profile-manager, 选定新配置目录
5. 享受新profiles

这样对打包备份很友好, 打成一个tar.gz再sign.encry一下, 可以带着走.

## conclusion

开始使用firefox, 支持开放的互联网.
