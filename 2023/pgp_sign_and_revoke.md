---
author: "Certseeds"
date: "2023-02-19"
title: "OpenPGP互签名与吊销"
description: "openpgp co-sign and revoke"
tags: ["openpgp", "security"]
---

# OpenPGP 签名与吊销

上一篇文章 <https://certseeds.github.io/Certseeds/posts/2022/openpgp通信/>

近期操作了一些签名与吊销操作, 记录一下防止忘记.

主要目的是旧密钥和新密钥互相签名, 声明两者之间的替代关系, 并彻底弃用旧密钥.

## 签名

虽然直接把两个密钥上传上去, 它们一起发布就能说明一些事实,但是感觉还是有点弱, 说服力还不够强, 所以希望能对密钥来一次互签名.

### 前提条件

+ 要对新密钥进行签名, 需要有新密钥的公钥+旧密钥的私钥
+ 要对旧密钥进行签名, 需要有旧密钥的公钥+新密钥的私钥

因此, 可以在断网机器上分别新建两个容器, 分别植入对应的文件.

### 命令解析

``` bash
# user @ device
$ gpg --import \
  ./public.key \
  ./private.key \
  && echo "prepare keys"
# user @ device
$ gpg \
  --ask-cert-level \
  --export \
  --sign-key ${keygrip_of_public_key} \
  && echo '--ask-cert-level是为了允许设置信任级别' \
  && echo '--export 目的是为了允许多重签名' \
  && echo '随后进入界面'
# user @ gnupg
$ tsign
# How carefully have you verified the key you are about to sign actually belongs to the person named above?  If you don't know what to answer, enter "0".
   (0) I will not answer. (default)
   (1) I have not checked at all.
   (2) I have done casual checking.
   (3) I have done very careful checking.
$ your_decision && echo '设置信任级别,密钥是否被它声称的身份所掌控'
# Please decide how far you trust this user to correctly verify other users' keys (by looking at passports, checking fingerprints from different sources, etc.)
  1 = I trust marginally
  2 = I trust fully
$ your_decision && echo '设置信任级别, 是否多途径验证'
# Please enter the depth of this trust signature. A depth greater than 1 allows the key you are signing to make trust signatures on your behalf.
$ your_decision && echo '要委托他签多少层的名'
# Please enter a domain to restrict this signature, or enter for none. Your selection?
$ your_decision && echo 'i do not know what is that'
```

可以参考 <https://tanguy.ortolo.eu/blog/articl9/pgp-signature-infos>

### 签署细节

非常迷惑的是, 如果只是用`gpg --ask-cert-level -u ${your_key_fingerprint} --sign-key ${fingerprint-of-tobesigned-pubkey}`来签名的话, 只能签出普通签名, lsign,tsign都无法签出, 有点神秘.

并且如果不带有`--ask-cert-level`的话, 默认都不能编辑签名的级别, 只有默认级别可以用...

签名公钥之后不会对私钥产生任何影响(这也符合预期), 不需要再合并-导出.

### 发送给对方

这一步由于是同一个所有者的密钥签名, 没什么意义, 可以忽略.

### 对方发布

由于接下来还有活要整, 暂时不发送, 只是把公钥分别暂存起来.

## 吊销

接下来就要吊销密钥了, 完成这一步后密钥就不再能使用了, 只能用来验证.

### 为什么要吊销而不是删除

如果直接删除的话, 历史上旧密钥签署的很多git提交就变成了未验证状态, 很难看. 吊销之后它们仍然是有效状态, 只不过会有一个小标签提示已经在提交后被吊销.

### 前提条件

+ 要对旧密钥进行吊销, 需要有旧密钥的私钥

可以复用上一步的镜像

### 吊销子密钥

这一步如果只为了github-web的话虽然可以不做, 但是为了encryption的安全性, 还是得把这个encry子密钥给吊销掉.

吊销子密钥相对来说比较简单, 不需要输入什么原因.

``` bash
# user @ device
$ gpg --edit-key ${keygrip_of_public_key}
# user @ gnupg
$ key 1 && echo '选中子密钥'
$ revkey
$ save
```

结束, 这一步操作实际上是给私钥签了个`revsig`, 公钥,私钥都改变了, 由于这一步也是在断网机器的容器里执行的, 可以直接把公钥导出过来, 再导入本地.

### 吊销主密钥

这一步是最重要的, 把主密钥给吊销掉, 今后不再使用.

这就最好不要使用gnupg内置的命令了, 建议先生成吊销证书(或者使用之前准备好的), 导入吊销证书进行吊销.

``` bash
# user @ device
$ gpg -a --gen-revoke ${keygrip_of_old_key}
# user @ device
$ gpg --import ./revoke.key
```

这个过程中gpg会提示写明吊销原因, 可以选择`丢失/替换/泄露`等等理由, 还可以添加几行注释进去.

这一步同样是公钥,私钥都会改变, 我们可以选择备份一下吊销证书以及公钥.

### 对外发布

最后将两个公钥上传到github, 再将其传到blog仓库, 结束.

