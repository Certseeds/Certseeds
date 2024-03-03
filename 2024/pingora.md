---
author: "Certseeds"
date: "20243-03-03"
title: "pingora, a rust library for replace nginx"
description: "pingora, 取代nginx的rust库"
tags: ["experience", "github"]
---

本文聚焦于pingora, 试图从相关的文章与仓库中挖掘出尽量多的信息.

相关链接

+ 博客文章: <https://blog.cloudflare.com/zh-cn/how-we-built-pingora-the-proxy-that-connects-cloudflare-to-the-internet-zh-cn/>
+ github链接: <https://github.com/cloudflare/pingora/>
+ 论文地址: <https://dl.acm.org/doi/10.1145/3600006.3613147>

## S3-FIFO

这个部分来自于: <https://github.com/cloudflare/pingora/tree/main/tinyufo>

pingora使用的缓存算法被称为 tinyufo, 融合了tinyLFU以及s3-fifo.

S3-FIFO, 全名Simple and Scalable caching with three Static FIFO queues(有三个静态FIFO队列组成的简单可伸缩缓存机制, 由于三个S以及三个FIFO-queue, 简称S3-FIFO), 来自一篇23年中的论文, 宣称其大幅度胜于LRU, 其主要思路是通过调查实际负载中的缓存访问分布次数来优化实际的算法.

文章声称通过调查对象访问次数的比率, 发现在实际业务中存在大量的 "one-hit wonder", 即从进入缓存到被逐出缓存, 其只被访问了一次, 从优化的角度来看应该尽量减少这种可能性.

这种对数据分布的调查猜测是通过在缓存算法中加入对访问次数的跟踪, 并在逐出时插桩发现的, 有大量的对象在被逐出时只有第一次被访问了, 其他时间没有被访问, 通过对 对象在被逐出时访问次数-对象数的调查, 发现这一特征.

在整个缓存中, 缓存对象热度的分布大致符合幂律分布(最小值为1), 而==1的访问对于缓存来说毫无意义, 需要尽快的将其驱逐, 因此参考tinyLFU设计出了S3-FIFO.

tinyLFU使用4个bite表示16种状态, s3-fifo只用两个bit; tinyLFU只有1%的空间(LIRS也是)用于过滤对象, S3-FIFO有10%(2Q算法有25%); 等等这些微小的差别, 我认为本文在撰写的过程中一定经历过大规模的调参, 他们在制订好架构后, 可能在G, S, M三个区域分别使用FIFO/LRU等算法, 并使用不同大小, 不同bits对其进行大规模实验, 最后筛选出了适合的可能性(你猜他们有没有藏起来更好的算法?), 然后从结果反推优势, 来分析问题的答案.

这篇论文介绍了常用的cache测试库 <https://github.com/1a1a11a/libCacheSim>, libcacheSim又引出来了一些常见的大规模数据集, 这很有用.

感想:

+ 类似之前google提出的汇编优化, 一般人都认为优化到头了的缓存领域, 居然也能有优雅的进阶实现, 令人感叹.
+ 数据集的分布对算法至关重要, 这篇文章一定是先发现数据分布特征再开始的实验.
+ 大规模对比试验真的有用, 调好参之后用一种马后炮的语气来分析, 隐藏自己的真实思路, 同时文风也适合论文.

## more TODO
