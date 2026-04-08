---
author: "Certseeds"
date: "2026-04-08"
lastmod: "2026-04-08"
title: "openpgp web key directory"
description: "一种优雅的openpgp证书声明方式"
tags: ["notes", "experience", "openpgp"]
---

# openpgp wkd: 一种优雅的openpgp 证书声明方式

openpgp的证书-密钥体系可以在本地上执行的很优雅, 密钥既可以保存在本地, 也可以转移到智能卡上; 证书则是一般保存在本地, 也会上传到 git 平台上供校验 commit, 又或者是放到博客中公开.

但是用这些方式存放的证书都有一个问题: 没有一个简单的方式, 能够在最需要证书-也就是发送邮件时快速加载到证书本身.

首先, 如果将证书发送到 github 等平台, 约定俗成的方式是 `https://{domain}/{user}.gpg` 来获取这个用户的证书, 而获取到的证书可能声明了多个地址, 而且除了一些 ID-Based 的 noreply 邮箱之外, 并不能直接从邮箱地址反向查找出谁声明了这个邮箱, 更致命的是, 即使能反查, 也无法确认声明的证书就是这个邮箱的拥有者声明的: 任何人实际上都可以声明一个他人的邮箱.

其次, 博客自然是个统一放置个人社交媒体信息的好方式, 可以声明邮箱, 各类社交媒体账号, mastdown, 以及证书; 但是除非借助搜索引擎, 或者是拥有域名, 不然一般还是没法从邮箱得知博客在哪里.

随后是解决了上面两个问题的 openpgp 集中式 keyserver, 它确实可以从邮箱地址直接反查出来声明了这个邮箱的证书.

但是, 一来由于设计问题, 集中式的keyserver对于证书是单调增加的, 证书只要被上传上去, 便不可被移除, 只能被追加式的声明吊销, 再叠加上一些初学者贸然将真实姓名, 甚至是照片上传上去, keyserver由于上述理由无法对其进行任何操作, 导致用户恐慌性的逃避上传.

二来, 它仍然没有办法解决证书是否真实属于某个邮箱这个问题, 更糟糕的是, 甚至可以恶意的将其他人的真实姓名, 照片与毫不相干的邮箱捆绑后打包发送到 key server, keyserver还会和其他 key server 进行互换, 将垃圾传播到每一个keyserver 中.

解决这个问题的就是 web key directory, 借助用户对域名的掌控, 约定好 email 中 username 和 domain的映射方式, 直接加载特定路径下的文件.

我们用 linux 内核邮箱列表的地址 `linux-kernel@vger.kernel.org` 来模拟一下流程

+ username: linux-kernel
+ address: vger.kernel.org

username经过 zbase32 处理后转换为 `rihjeorafgpm6hrmbdz9p98syi1ikpcg`, email保持不变.

则先head `{openpgpkey}.{domain}/.well-known/openpgpkey/{domain}/policy` 确认 200后, 直接 GET `{openpgpkey}.{domain}/.well-known/openpgpkey/{domain}/hu/{zbase32-username}` 获取到证书, 结束.

如果不希望新开子域, 也可以在 `{domain}` 下面放, 逻辑类似, 路径不同, 不再赘述.

这套逻辑利用了邮箱拥有者对域名的唯一掌控能力来实现了绑定, 直接解决了胡乱声明问题.

当然, 并不是所有人都有能力搭建自主的服务器来实现, 对于 gmail, outlook等服务提供商就不提供托管证书的服务, 但是对于服务商来说, 无论是子域方式还是主站方式, 托管证书是**可能**实现的.

如果邮件服务商不提供托管, 可以使用 cloudflare pages 托管静态资源并绑定子域名, 收件域名转发到其他服务提供商可以使用 cloudflare email 的转发服务, 搭配 openpgp 的 encry 体验更佳, 也不需要担心内容被中间人阅读了.

现在这个版本, cloudflare email forward全免费, 但是 email send 服务还在内测, 并且也只是用 api 方式来暴露, 当向其他人发送邮件时, 可能需要你指定 `reply-to` 自己的 forward 地址(当然是带着openpgp wkd设置的那个), 由此实现双向的 gpg 加密

这种方式还很容易实现, 因此电子邮件客户端中可以直接集成加载逻辑, 键入收件人就可以自动尝试 https 方式拉取证书, 用户体验也很棒.

最后, 我的openpgp page 网站 <https://openpgpage.certseeds.com/#/wkd/> 实现了上传证书文件, 生成适合直接部署到静态资源站点的zip文件的功能(纯前端实现, 无需后端交互, 无数据记录), 可以不再需要调用本地的 gpg client, 欢迎使用!
