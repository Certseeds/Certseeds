---
author: "Certseeds"
date: "2022-11-27"
title: "openpgp通信"
description: "connection by openpgp"
tags: ["openpgp", "security"]
---


# 基于openpgp的通信

## openpgp的双向通信

在复杂的网络环境中,确认发送的信息能够被别人完整的接收到是相当困难,可以采用一些密码学手段对通信内容加工,使得信息在流转过程中,即使中途被截获,也无法被解读,强行改写可以被对方发现.

根据发件人,收件人的性质不同,可以粗略分成以下几种情况

+ Alice给Alice发送信息, 利用公共空间保存一些密文, 不希望任何人对内容有所了解.
+ Alice向Bob发送信息, 最多只希望别人知道两位之间有沟通,不希望任何人对细节有所了解.
+ Alice向所有人发送信息, 点名批评Bob, 希望所有人都知道这条消息是Alice发送的.

我们接下来依次对这几种情况进行讨论

## Alice的公告

先来讨论比较简单的Alice发送公告的情况, 考虑一下现实中如何公告一件事.

``` log
OK 兄弟们
全体目光向我看齐嗷
看我看我
我宣布个事儿
BOB是个****
没毛病嗷
```

1. 大家看到真人就知道是Alice在说话
2. Alice大喊全体目光向我看齐, 吸引大家眼光
3. 在说话过程中点名批评了Bob, 又加以确认.

+ 如果单纯是一个虚拟人+虚拟音, 大家无法分别是谁在说话
+ 如果什么准备工作也不做, 直接点名批评, 那么没人能听到
+ 如果没有说关键的语句, 宣布个事直接接没毛病, 那就没有意义.

将现实生活中的步骤和公私钥体系一一对应起来:

1. 需要建立起Alice和公钥的对应关系
+ 线下活动互相交换公钥
  + 其他人给公钥签名(之后讲)
+ 个人网站公布公钥
+ 邮件交互中附带公钥
2. 需要通知大家,不仅让Bob收到,也要让其他人收到
+ 邮件收件人写Bob, 抄送其他人
+ 在Bob的个人网站上填上信息, 并将此页面贴到其他页面
+ 在自己的个人页面上填上信息, 发送到社交媒体上.
3. 写明关键信息, 不要当谜语人

这之后, Alice需要在发出信息之前,对信息使用私钥签名
1. 为了更高效率的传播, 需要确保信息是文本格式的, 不要变成二进制格式
2. 为了避免信息被更改, 需要将信息和签名绑定到一起, 避免两者分离.

脚本可以参考[./openpgp/publish.sh](https://raw.githubusercontent.com/Certseeds/Certseeds/master/2022/openpgp/publish.sh), 会将输入文件加一个`.sign`后缀添加到本地, 可以用这个发送(建议加一个到自己公钥的链接来提高下可信度)

经过测试, 只需要公钥即可`gpg --verify-files`确认签名是被其对应的私钥签署的. 由于这里是明文的,也没什么提取不提取的问题了.

## Alice向Bob发送信息

这个情况下Alice向Bob发出一道讯息, 最多只希望邮件服务商知道有这么个邮件, 完全不希望中途能有人能看懂数据,也不希望有人对数据动手脚.

首先, Alice自己使用自己的私钥对讯息签名, 使用Bob的公钥对讯息进行加密.

+ 使用自己的私钥签名, Bob(或任何人)在线下或者在个人主页获取到Alice的公钥后,可以很方便的确认信息是Alice发出的,中间没有修改过
+ 使用Bob的公钥对讯息进行加密后, 只有Bob自己持有私钥, 可以对讯息解密, 拿到原始数据.

并且为了缩小加密文件的体积,建议产生二进制的文件, 不使用ascii封装产物.

由于这里有加密,签名两个步骤,很难不多想到底顺序是什么, 查阅一些资料后可以得到结果.

1. 如果先加密,再签名, 可能有中间人将其截获, 换一个签名之后使用另一个邮箱发送, **相同信息,发送方不同可以表现出完全不同的语义**.
2. 如果先签名,再加密, 只有收件人能够将其打开, 再使用公钥验证, 这样就不需要防备中间人拦截了.

先签名再加密还有一个好处, 由于无法直接校验发件人, 可以将信息公开, 最典型的例子是隐写成文本,图像之后放置到图书馆内的藏书中.

当然这样也有坏处, 由于是拿对方公钥加密的, 你自己也没法直接看里面的内容, 也没什么办法来校验签名来看看是不是自己签的(如果你忘了的话).

具体脚本可以参考[./openpgp/private.sh](https://raw.githubusercontent.com/Certseeds/Certseeds/master/2022/openpgp/private.sh)

## Alice向自己发送信息

这种情况是特化版本的Alice-To-Bob, 只不过Bob是Alice, 因此也可以使用[./openpgp/private.sh](https://raw.githubusercontent.com/Certseeds/Certseeds/master/2022/openpgp/private.sh). Alice既有私钥也有公钥, 只不过想在一些地方埋一些宝藏,或者在仓库里放一些只有自己能打开的莫名其妙的二进制文件来隐藏一些关键信息.

PS: 有些疯狂的家伙会把自己的私钥用私钥签名,公钥加密之后公开放到个人网页.

这个情况也是一个特化版本的Bob-To-Alice,只不过Bob是Alice, 因此适用[encry.sh](https://raw.githubusercontent.com/Certseeds/Certseeds/master/encry.sh)这个脚本, 只不过encry.sh为了方便在issue,discussion里面发布, 输出不是二进制的文件,而是文本.

可以观察到上面两个脚本里面都没有指定签名使用哪一个密钥, 这个是因为签名需要私钥, 一般本地只有自己的私钥(不觉得随便拿对方私钥是好事), 没有指定的必要. 如果你有多个子密钥在gpg里面,建议考虑下使用精简过后的容器来进行签名,加密等工作,一个容器里面只放一对.

## hide file size

虽然经过了签名和加密之后, 签名方和密文内容都没法直接被中间人获取到,但是至少有一点可以确认, 密文和密文内容的信息长度大概是可以对应的(要考虑到签名长度以及加密强度,不是简单的线性关系,但是至少是正相关的), 所以,为了隐秘这个信息,可以使用一些手段来给密文内容前后拼接点随机信息, 以便密文定长(我不觉得重复几遍密文内容是什么好主意).

由于大多数情况下非对称加密是用来直接加密不那么长的内容的(包括对称加密的密钥), 可以假设一个比较小的值, 比如65536字节作为目标长度.

PS: 为了增加随机性,建议每次随机对长度进行一定幅度的增加或者减少.

``` bash
$ ls -la ./README.words.md
343 ./README.words.md
$ echo $((65536-343))
65193
$ head -c 65193 /dev/urandom > ./README.words.md.postfix
$ ls -la ./README.words.md.postfix
65193 ./README.words.md.postfix
$ tar -czvf \
    ./README.words.md.tgz \
    --owner=youknow:1000 \
    --group=therules:1000 \
    --mode=0644 \
    --mtime='UTC+0 1926-08-17 $(shuf -i 0-8):$(shuf -i 0-59):$(shuf -i 0-59)' \
    ./README.words.md ./README.words.md.postfix
$ ./encry.sh ./README.words.md.tar
./README.words.md.tar.sign.encry
$ ls -la ./README.words.md.tar.sign.encry
90627 ./README.words.md.tar.sign.encry
```

之后拿到产物

需要注意的是, tar

+ 会保存用户信息, 如果不想往里面附加的话, 需要加指令抑制读取默认的owner:group/
+ 会采集文件mode,不想打包进去需要指定为0644.
+ 会采集文件的时间, 不想被采集进去需要加指令, 指定为特定的一个时间.

## 签名其他人的公钥-建立信任链

之前提到, 需要大家知道, 一个公钥和一个实体是对应的, 这样被私钥签过名的内容才能被认可是实体发出的, 实际上这里就是公私钥密码学最薄弱的一环: 除了线下判断之外, 没有另一个能够完全可信任的方式.

但是, 如果这样对应需要完全依赖线下进行的话, 效率未免太低了, 每新增一个新用户, 全部人都得聚会一次,把他的公钥导入到自己的公钥库中, 标记上完全信任, 这样沟通团队越大岂不是成本越高...?

答案是使用信任链, 新人加入之后, 选择少数几位用户, 线下和他们碰面之后 , 这些用户对新人的公钥签名(签名类型: 普通签名,信任级别: unknown), 新人将其导入自己的公钥中.

这样, 新人之后发送的邮件会使用新人的私钥签名,  附带的公钥带有老用户的unknown签名, 由于和他沟通的人都有这几个老用户的签名,至少也在本地打了Marginal级别, 所以能够确定这个公钥对应的就是新人.

几位老用户签名一个新用户, 这样一轮一轮扩散出去之后, 能够绑定住所有需要和其他人交互的用户.

由于gpg签名还挺麻烦的, 有一些很容易混淆的概念.

### 签名类型

+ 普通: 只有信任级别附加
+ 信任: 个人几乎不用, 可以委派签名
+ 本地: 没法发送出去的签名, 只有本地有用.
+ 不可撤销: 不怎么合理的签名类型.

一般见个面, 吃个饭会涉及到的签名也就是普通和本地两个.

### 签名的信任级别

这个可以被`--ask-cert-level`所触发, 添加到sign-key里面

+ None specified: 没什么好说的, 默认级别
+ No verifcation: 签了, 但是没验证,sig1
+ Casual Verification: 检查了下, 但是没有多途径, 不能完全100%确定.
Also called a . You ran a few checks to make sure that the key you’re signing belongs to the person identified in it, but nothing too major.sig2
+ Extensive Verification: 完全确定, 这个公钥能对上使用者.

PS: 如果你完全不知道这个公钥所有者-pid的实际对应关系, 请不要去签名

一般线下只进行一次沟通的话也就签个sig1/2, 你得继续跟对方沟通, 越来越熟悉之后, 才会签sig3

### 信任级别 ownertrust

需要注意, ownertrust 这个信任级别是不会导出到sign-key里面的, 纯本地存储, 需要靠个人判断来分级, 默认标记成margain就可以.

+ unknown: 默认的, 这个公钥的使用者能和它的pid对应上, 但是你不知道它会怎么样对其他人签名.
+ never: 反向签名, 在unknown基础上,标记你知道公钥的主人会胡乱给别人签名, 啥也不确认.
+ margarin: 在unknown基础上, 这个公钥的使用者平常签名的时候至少会确认,公钥能和使用者对应是有证据的(就像你一样),它**不会**胡乱签名
+ full: 在margarin基础上, 这个公钥的使用者签名的水平和你一样谨慎(?), 会确认其他人和他一样谨慎的时候才会签发full.
+ ultra: 只有自签名会用到, 声明pid这个是我自己.

PS: 如果你完全不知道这个公钥所有者-pid的实际对应关系就胡乱签名, 你会被别人标记为never的, 你都不会注意到...

新的密钥默认就好, 越来越熟悉之后再提升级别.

### 签名方式

参考 <https://wiki.debian.org/Subkeys>

>
> More specifically, you need the primary private key:
> + when you sign someone else's key or revoke an existing signature,
>

对其他人密钥的签名需要主密钥! 如果你对安全性有保障的话, 主密钥一般是离线保存的, 这也就意味着, 对其他人密钥的签名是一件挺花费精力的事情, 并不像平常签一个git提交一样简单, 需要折腾一个断网环境.

注: 感觉这里很奇怪, 设计者把主私钥给其他公钥签名这个操作一个特殊的名字:"certification",子私钥没法做这个操作, 但是其实子私钥给别人的主公钥签个名(结尾加一行写明原因)也能表示这个效果,分离式签名还可以搞签名链什么的, 感觉是设计的时候没想好?

理想状态下, 主密钥离线保存需要一个设备,离线的机器一个设备, 被签名的公钥又是一个设备(因为机器断网了, 需要用把公钥带过来再带回去),  这就要求一台电脑两个U盘了, 折腾半小时一点也不是问题...

0. 将主密钥导入gpg
1. 将被签名的公钥导入gpg
2. gpg --ask-cert-level -u ${your_key_fingerprint} --sign-key ${fingerprint-of-tobesigned-pubkey}
3. gpg -a --export ${fingerprint-of-tobesigned-pubkey} 导出被签名的公钥, 跳转到1 直到所有公钥都签过名了(不然重新搞一边太麻烦了)
4. 将签过名的公钥装回到设备上
5. 将离线设备复原
上面是离线设备的操作,下面是在有签名子密钥的设备上进行的操作.
6. 使用[private.sh](https://raw.githubusercontent.com/Certseeds/Certseeds/master/2022/openpgp/private.sh)来对每一个公钥进行自己的私钥签名+对方的公钥加密
7. 将签过名的证书, 自己私钥签名+对方公钥加密之后传给对方
接下来是对方的操作, 如果对方不想完全可以不这么搞..., 同时注意, 不要直接把签过名的推送到公钥服务器, 或者是直接post出来, 不然没法证明密钥所有权, 也很不尊重.
8. 对方使用自己私钥解密出来, 决定是否公开

参考上面的"签名的信任级别" vs ownertrust, 幸好这俩不一样, 前者基本上不改变, 一开始签好就基本不变动了.
