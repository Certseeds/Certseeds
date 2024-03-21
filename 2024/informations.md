---
author: "Certseeds"
date: "2024-03-20"
title: "Build credible information channels"
description: "构建可信的信息渠道"
tags: ["blog", "frontend", "information"]
---

# 构建可信的信息渠道

记录一下如何构建与维护可信的信息渠道.

## 博客

这一部分请参考: <https://blog.certseeds.com/posts/2023/build_page_by_hugo/>

## 在静态网站中提供mastodon服务

本文发布在一个静态页面 <blog.certseeds.com>上, 是否有可能存在另一个域名<mastodon.certseeds.com>, 这个域名商部署了构建好的静态页面, 使得其他人可以通过"关注"操作关注这个域名上的某一个特定用户, 并能够获取到这其中的信息?

### 相关链接

mastodon的主仓库: <https://github.com/mastodon/>
activitypub协议的介绍: <https://docs.joinmastodon.org/spec/activitypub/>

### 幻灭

本来以为可以的, 但是找到这两份之后发现似乎不行...

+ <https://emptystack.top/activitypub-for-static-blog/#%E9%9D%99%E6%80%81%E5%8D%9A%E5%AE%A2%E4%B8%8EActivityPub%E5%85%AB%E5%AD%97%E4%B8%8D%E5%90%88>
+ <https://lawrenceli.me/blog/activitypub>


最主要的原因是:

> ActivityPub则期望你主动向别人POST自己的新信息，并且能够处理别人POST来的信息。这也是浏览别的实例用户时会碰到“不会显示来自其他服务器的更早的嘟文”的原因——你的实例没人关注对方，对方就不会主动把消息POST到你的实例

引用自 <https://emptystack.top/activitypub-for-static-blog>

不想在静态页面后端绑定一个Serverless Functions, 后者严重依赖平台, 还是有状态的, 难搞.

## nostr

nostr是一个相对于mastodon使用的activitypub更分布式的协议, 它使用公钥-私钥体系来维护账户体系: 因此不存在账号的归属一说, 也没有一个个的小型中央化服务器, 取而代之的是"中继器", 保存签了名的数据的中间节点.

注: 往git上的commit进行gpg签名, 也可以算一种猴版的nostr.

如果我们使用 <https://nostr.certseeds.com>域名, 往上面部署一些静态页面, 假装自己是一个不怎么动弹的"中继器", 是否可行呢?

### 相关链接

+ 起源: <https://fiatjaf.com/nostr.html>
+ 服务端API文档: <https://github.com/nostr-protocol/nips>

阅读之后可以发现, 客户端和服务端之间通过websocket来联系, github-pages还是不支持这个, 这条路走不通...

TODO: 有没有可能在提交过程中, 使用gog对博文进行签名, 之后通过工具将其上传到nostr中继器?

## RSS

TODO
