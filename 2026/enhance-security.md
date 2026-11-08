---
author: "Certseeds"
date: "2026-11-08"
lastmod: "2026-11-08"
title: "enhance-security about blacklist"
description: "通过黑名单提高设备安全性的两三事"
tags: ["notes", "experience", "security"]
---

# 通过黑名单提高设备安全性的两三事

之前在本地展开了一张巨大的 DNS 过滤网, 规则总量 60 万条以上.

域名层的黑名单解决的是"去哪找"的问题: 解析被拦掉, 大部分广告、追踪与已知恶意站点就进不来.

但它有明显的边界——只能让某些软件无法获取垃圾, 从而让他们无法在本地显示; 或者无法将信息送出. 但是至于他们在本地怎么扫描, 检测, 空转, 乃至跨进程通信, 这不是 DNS 拦截能处理的.

于是黑名单自然要往下一层延伸: 从域名延伸到应用.

Windows 上这些 "软件" 做的事情大多谈不上违法, 但足够恶心: 弹窗、捆绑安装、篡改主页、静默装全家桶.

而它们绝大多数以公司的形式运营, 为了不被安全软件拦截, 都会给自己的程序配上"证书".

这反而提供了一个比域名更稳的抓手: 域名可以换, CDN 可以共用, 安装包可以离线传播, 但签名证书花了钱, 只要没过期, 大多数情况下就会接着用.

Windows 的信任模型也恰好让这件事可行: exe, dll等 PE 格式大部分都会签名, 签了名就是强校验: 签名被拉黑, 且不说他们自己的exe, 其他应用嵌入的dll都运行不了.

因此设备侧能自主控制的, 是维护一层自己的证书黑名单.

而上游的 CA 层也未必可靠: 2026 年 10 月, 印度证书机构 eMudhra 的 8 张 HTTPS 中间 CA 证书被曝出私钥弱到可以暴力枚举, 引发了我对印度这个国家证书的不信任.

最近一段时间围绕这个方向做了几件事, 应用签名证书与 HTTPS 证书都有涉及:

+ 从安装包里提取签名证书的扫描器 signscan
  + 还发现了它很快被一个网站使用
+ 把证书批量编译成 WDAC 拒绝策略的 bulkban
+ 以及按 CA Owner 国别把 HTTPS 根证书与中间证书写进"不信任"存储的 rootvote.

## signscan: 先把证书挖出来

要拉黑证书, 首先得知道证书长什么样、从哪里来.

signscan 是一个 .NET 10 / NativeAOT 的单文件 CLI, 直接扫描目录里的 PE 与 Windows Installer 文件, 把 Authenticode 内嵌的签名证书提取出来.

PE 侧覆盖 exe、dll、sys、drv、ocx、cpl、scr, 读取的是 PE 证书表

MSI 一侧覆盖 msi、msp、mst, 签名不在 PE 结构里, 而在 `DigitalSignature` 流中, 因此程序按文件头分流. 解析 PKCS#7 之后取 `SignerInfo` 的证书, 对 `signtool /as` 产生的嵌套签名按 OID 递归, 深度限制为 8.

值得一提的是它只做提取, 这一层只关心"这个文件由哪张证书签过", 好坏判断留给后面的黑名单决策.

另外, 实际处理安装包语料时, 推荐使用 msitools 解开 msi, 把包内的 exe 再单独扫一遍: MSI 自身的签名只覆盖安装包, 里面的可执行文件可能另有签名.

落盘规则很简单: 文件名就是 `{begin}-{end}-<DER SHA256>.cer`, 哈希相同即同一张证书, 天然去重.

文件按公司分组存放, 同时生成 `company-app-to-cert.json` 与 `cert-to-company-app.json` 双向映射, 应用与证书的关系都记在映射里, 后续无论是按公司拉黑还是按应用排查都能直接查.

`--allow-dir` 则提供了白名单的"减法": 扫一遍白名单程序目录, 把这些程序的证书从黑名单里减掉.

工程上还做了原子写、跳过 reparse point 和单文件发布.

它可以作为一个工具, 快速从应用安装包中提取出'疫苗', 供后续'接种'.

## 也巧: 发现了一个适配的网站

证书从哪来? 偶然发现了一个域名: `certlens.pages.dev`.

这个站点把证书整理成了按公司与应用组织的目录, 纯前端静态站点, 可以按目录/公司/应用筛选、搜索, 也能全选、排除后导出筛选结果的 zip.

对黑名单来说它恰好补上了最缺的东西: 成规模、可检索、可导出的证书语料.

从内容看, 它结合了多个开源库的证书数据, 至于剩下的 .cer 是通过什么方式收集的, 不得而知.

不过从证书命名格式与提取结果推测, 它大概率用了 signscan.

语料本身也做了许可确认:

+ 部分证书来自几个公开的证书黑名单项目, 按 MIT / GPL 等协议收录;
+ 站点使用 AGPL
  + 但是没有公开仓库

> 虽然这个网站没有公布背后的仓库, 但是, 它将站点以及站点代码一起发布, 确实符合 AGPL

这个网站则相当于把各家'疫苗'做成了'联合疫苗', 接种一次即可, 少打 500 针.

## bulkban: 证书到 WDAC 拒绝策略

有了证书, 下一步是让系统真的拒绝它们.

把证书写进 Disallowed(不信任)存储是一条现成的路, [Malware-Patch](https://github.com/the1812/Malware-Patch) 已经这么做了.

但这条路还是有点不够好: 一来证书和代码放在一起, 更新得跟着发版, 比较慢; 二来它只是撤销信任, 似乎还存在用户确认 UAC 后仍能执行的问题.

Modern Windows 引入了 WDAC(Windows Defender Application Control), bulkban 选择了它: 把一批代码签名证书批量转换成 deny signer 规则.

流程是:

1. `certs/` 按顶层目录分组, 根目录的零散文件归入 `others`
2. 每组以 AllowAll 为模板, 逐证书执行 `Add-SignerRule -User -Deny`, PolicyID 用 `UUIDv5(命名空间, "v1/组名")` 确定性生成, 同一组重复构建就是策略更新, 不会产生孤儿策略
3. 最后 `ConvertFrom-CIPolicy` 生成 CIP, 并输出 SHA-256 sidecar 与 `manifest.json`.

证书准入有明确边界: 只接受 RSA(不超过 4096 位)、非 CA、且带代码签名 EKU `1.3.6.1.5.5.7.3.3` 的证书, ECDSA 等会被记入 `unsupported`.

过期证书不会被跳过: 历史包只是签名老, 仍然可以安装, 所以规则必须保留

借助于WDAC的两个模式, 这套工具可以安全灰度: audit (只在事件查看器里面log) 与 enforce(直接拒绝) 是两套互不覆盖的产物, 默认只生成 audit, 显式指定 `--enforce` 才真正 ban.

再者, `manifest`、产物目录与 CIP 头部偏移 0x26 的 audit 位三重交叉校验, 对不上就拒绝安装.

安装时有 `CiTool` 就走 `CiTool`, 否则写入 `CodeIntegrity\CiPolicies\Active`, 重启后生效.

`verify` 只读 manifest 校验结构与哈希, `remove` 则读 `state.json` 只清理自己安装过的策略.

由于 Windows 11 21H2 仍限制 32 个活动策略, 程序要求 Windows 10 22H2(19045+)、Windows 11 22H2(22621+)或 Server 2022(20348+), 遇到更低版本直接拒绝.

成功安装后, 就可以观察到

``` log
你的组织使用适用于企业的应用控制阻止此应用

{PATH}\{software}.exe

有关详细信息, 请与你的支持人员联系。
```

这样酷炫的提示: 完全无法将其启动.

bulkban 相当于接种, 可以接种 '日志针'来检查, 过几天之后就可以接种 '禁用针'来激活免疫反应.

## rootvote: 从信任链上按国别拉黑

这个需求的起点很具体: 2026 年 10 月, 印度证书机构 eMudhra 的 8 张中间 CA 证书被曝出私钥存在严重问题: 这些 P-384 私钥的取值全部小于 256, 最低的只有 4.

根证书与中间证书是整条信任链的地基, 一旦私钥强度不可靠, 它签出的所有证书都不再可信.

signscan 与 bulkban 处理的是"具体签名证书", rootvote 则把处理对象上移到更上一层的根证书与中间证书, 并把 CA Owner 的国别作为筛选维度做批量拉黑, 作为可执行、可回滚的止损手段.

它通过 `crypt32.dll` 直接操作 Windows 的 Disallowed(不信任)存储: 打开存储、按 SHA-1 查找、调用 `CertAddEncodedCertificateToStore` 写入, 撤销时再删.

在 Windows 上, 它不删除 Root 存储里的证书, 也不修改任何信任设置; 效果是只要某条证书链里出现被拉黑的根或中间证书, 链验证就会失败.

默认使用 user scope, 因此不需要管理员权限; machine scope 才需要提权.

数据来自 CCADB 快照, 版本由 `go.mod` 锁定, 构建期内嵌进二进制, 运行期不需要网络.

它会同时收录 Root 与 Intermediate, 因为退役或禁用的证书仍可能出现在链里.

这个工具"可审计、可撤销、可复现".

+ 可审计: manifest 会逐条校验 schema、路径规则、PEM/DER 与文件名中的 SHA-256 是否一致、是否重复、数量是否与 summary 相符, 任一失败整体拒绝, 并且一定是先校验后修改.
+ 可撤销: `state.json` 以 tmp+rename 方式记录 scope、previous_trust、manifest SHA-256 等信息; `undo` 只撤销 rootvote 自己添加过的条目, Windows 上预先存在的条目不会被动, NSS 中已存在的证书会改 trust, 撤销时恢复原值.
+ 可复现: `generated_at` 固定为快照时间, 排序与 JSON 格式固定, 保证字节级可复现.

同一套逻辑还覆盖了 Firefox/Thunderbird 的 NSS(写入 `p,p,p`, 即 SSL、S/MIME、代码签名全部 prohibited)与 Debian/Ubuntu 系统信任库(`ca-certificates.conf` 中加 `!` 前缀并执行 `update-ca-certificates --fresh`), 后者带备份、flock 防并发与失败回滚.

> 感谢 CCADB, 它维护着完整的根证书签发历史, 不需要自己维护证书库, 只要定期更新依赖、重新发版即可.

## 把四块工作串起来

现在的工作流大致是:

1. 用 rootvote 拉黑印度证书;
2. 用 signscan 扫描自己需要的安装包语料, 提取证书并生成公司与应用的双向映射;
3. 用 "certlens.pages.dev" 补足, 按公司与应用筛选、导出;
4. 用 bulkban 把证书编译成 WDAC 策略, 先 audit 观察, 再切换 enforce;
5. 出问题时, bulkban 用 `remove` 按 `state.json` 清理, rootvote 用 `undo` 按自己的记录回滚.

另外, signscan、bulkban、rootvote 这几个 Windows exe 都已经进了 `Certseeds/scoop-cn-apps` 库(bucket 名 `cn-apps`), 用 scoop 可以直接安装和更新.

## 几条经验

1. 文件名对可视化很重要, Malware-Patch 用的是奇怪的命名方式, 很难看出来证书的变迁史. 而 `{begin}-{end}` 模式就能明显观察出互相覆盖的时间, 以及有没有时间缺口.
2. 先审计后强制. 黑名单最容易造成误伤, audit 模式让策略先跑一段时间再收紧, 比事后救火便宜得多.
3. 可撤销是一等公民. manifest 负责"装了什么", state 负责"我改了什么", 撤销只碰自己动过的部分, 才敢在真实设备上批量操作.

### 一部分缺陷

+ rootvote 的国别维度比较粗
+ signscan 没有细化到拆包分析 exe 里面的 dll, 依赖外部拆分.
+ bulkban 目前 build 阶段只能在windows pro上跑, 并且由于并不维护list, 导致无法分发 build 产物.
+ WDAC 对 ECDSA 证书暂不支持

## 总结

DNS 阻断垃圾进出, rootvote 一键拉黑印度证书, signscan-bulkban 阻断 'company' 级别的应用.

层面不同, 手法一致: 把"无信者"快速踢出.

> peter parker 式命名法真好用
