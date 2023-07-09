---
author: "Certseeds"
date: "2023-07-09"
title: "register_domain"
description: "在cloudflare上申请,管理域名"
tags: ["cloudflare", "security", "dns"]
---

# register_domain

近期变更了blog的网址, 记录一下过程.

## 供应商

+ domain.com
+ namecheap
+ namesilo
+ godaddy
+ cloudflare
+ 其他公有云厂商

domain.com,namecheap这种网站, 从名字也能看出来, 就是专门主打一个域名生意; cloudflare, amazon这种云厂商会把域名当作一个附加服务, 不为挣钱, 而是当作其他服务的添头, 或者说营造服务的闭环.

### 域名供应商的套路

专门搞域名的供应商瞅着这个赚钱, 就很喜欢玩花招. 有些时候第一年1刀, 但是只能两年25刀一起买, 折合其实没降多少; 有些时候默认是挺便宜, 但是会给附加勾选/默认弹窗推荐附加的服务; 还有某些厂商喜欢给whois隐私特意加钱, 不想让自己数据外露出去就得额外花钱.

这些都还是买之前的套路, 有些平台会想尽各种办法阻止人转出, 某些厂商会逐渐把价格给提上去, 综合来看, 还是选一个不用这个来赚钱的平台比较好.

## cloudfalre

从体验上来看, cloudflare做的不错, 默认送whois保护, 直接用cf统一的模板来往系统里面填写; 承诺不加价, 只收成本费; DNSSEC默认免费打开; 转出也是没难度.

## register and manager domain

对于一个域名来说, 管理DNS记录就像在操纵一个KV数据库, 一般主要操作A,AAAA(ipv6), CNAME和TXT.

### A and 4A

对github-pages来说, A和4A需要分别映射到page给的那几个ip上.

### CNAME and github conf

0. 在用户中将`${domain}`给验证为自己的域名, 需要添加TXT记录.
0. 将特定的前缀给CNAME到github.io上面
0. 将`${prefix}.${domain}`加入仓库的CNAME文件中
0. 在设置中将`${prefix}.${domain}`加入配置, 等待DNS验证.

第一步只需要操作一次, 后面三个每次都要操作, 之后github会把部署的链接改为`${prefix}.${domain}`,还会给这个域名签发let's encrypt的证书.

这里似乎是github.io内部做了映射, 也许是根据某些http-header, 搞了自动的跳转.

最后不要忘记将原有仓库中的链接, 构建阶段指定的域名替换掉.

### TXT for mails

cf还会推荐一些操作, 比如给www加一个a记录或者CNAME, 为了邮件安全, 加一些TXT记录, 一开始也是有点莫名其妙,  看了这篇推广文<https://www.cloudflare.com/zh-cn/learning/dns/dns-records/dns-dmarc-record/>之后理解了, 防患于未然.

邮件由于一开始设计的问题, 一些信息可以被"伪造"出来, 而且如果没有特意设置, 看不出来是不是真的.

但是可以用一些约定好的TXT记录, 声明这个域名不发任何邮件, 从而让接受邮件的服务器在验证规则时按声明操作, 把某些邮件过滤掉, 从根本上解决问题.

0. 不发邮件, 显然不应该有MX记录.
1. SPF记录会声明这个域不从任何ip发出邮件.
2. DKIM记录会声明发出的邮件应该可以被哪些公钥解密, 既然不发, 其实可以生成一个然后把私钥丢掉.
3. DMARC记录指示接收者应该100%拒收通不过验证的邮件, 然后定时把这些邮件抄送某个邮箱.

通常这些规则应该默认就配置, 毕竟绝大多数域名都不会自己建一个邮件系统, 但是由于这几个记录RFC出来比较晚, 无法做到默认就生成进去, 令人感叹.
