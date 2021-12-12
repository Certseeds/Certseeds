# 从Map-Reduce到Google-File-System,谷歌的分布式之路

## 前言

本篇文章将简要介绍MapReduce以及Google-File-System的结构与思想, 作为之后回想的素材

## MapReduce

MapReduce是什么? MapReduce是一个针对处理大规模数据集所提出的编程模型(或者说范式?),(google内部的实现也叫做MapReduce,但是这个版本是闭源的,外界无从得知,也没法使用,所以一般指模型,为了简单,之后将实现了MapReduce接口的实现也叫做MapReduce,简称MR).

MR只需要用户输入数据集,Map函数与Reduce函数便可以得出结果

### Introduction　简介

google本身存储有巨大的数据量,文档,日志,网页,etc... 但是,对这些数据来说,绝大多数的查询是比较简单的, 比如查个最晚修改日期之类的. 但是,在巨大的数据量下, 简单的问题也会变得复杂起来: google需要一套简化大数据量运算的框架.

大数据量的计算, 显然不仅仅需要单台机器的算力,需要的是大规模运算集群的计算能力与存储能力(一般PC机在拥有运算能力的同时,也会有一定量的存储能力,不会完全充当计算节点),还需要妥善的错误处理能力-毕竟google的机器很多都是非企业级的.

通过对函数式编程中Map,Reduce概念的抽象, Google设计出了MR这个编程模型,拥有一个对使用者友好的接口,同时还能自动并行,进行分布式大规模计算,将大规模不稳定(相对来说的不稳定)集群统合成强大的对外算例

### Programming Model 编程模型

计算的核心输入为`(key,value)`对集合,输出是一个`set<(key,value)>`,用户只需要提供数据集,Map-Function,Reduce-Function即可

用户提供的Map-Function输入`(key1,value1)`,输出`list<(key2,value2)>`,这个过程中key1和value1有可能不会被全部用到,并且key1,value1也不一定是元数据,完全可能是文件名,文件下载URL,目录名等`metadata`

reduce-Function输入`(key2,list(value2))`,输出`list<(v2)>`,这里的输入就都是数据而非元数据了. 可以注意到, 这里的输入不同于Map-Function的输出, 中间的合并就是MR自己的工作,输出也并非是v2,而是`list<(v2)>`,此处既可能是一个object,也可能是一个列表,反正只是作为一个键值对里的值.

### Implementation 实现

1. Map-Reduce的实现依赖于环境-倘若是只有一台机器,那就没什么可说的了,提供一个模板仓库得了-填一下Map-Function,填一下Reduce-Function, 运行-输出.

在一个巨大的,既具有存储能力也具有运算能力的家用级节点连接在一起的,被调度系统持续调度工作的系统上, 则需要完全不同的设计.

#### 总体设计

系统中存在一些超参数,比如最终Map节点数量M,Reduce节点数量R,一般情况下M>R十几倍到几百倍

1. 将输入数据,按一个固定的块大小(一般16-64MB)分割成M个块,在机器上启动节点
2. 特殊节点-主节点分配其他节点的任务,分配M个Map节点,R个Reduce节点
3. Map节点从块中读取数据,解析其中的k-v对,并将结果缓存在内存中
4. 缓存对被写入持续性存储(注一),通过一个分配函数(一般是一个哈希函数)随机分配到R个文件中,(M个节点,每个节点R个文件,一共$M*R个文件$),并且这些文件地址回传给master,master又将其分配给Reduce节点
5. Reduce节点远程读取分配给自己的M个文件,将读取到的M个文件中的(key,value)对,通过key排个序; (一般来说,本身一个块16-64MB就不大,Map完了之后再拆分R个就更小了,有时reduce可以都将这M个文件都读到内存里,---不行的话就得外排序了)
6. 排序之后就可以在遍历过程中很自然的取得相同的key对应的`List<(value)>`,送入reduce函数,将输出汇总到一起,完成.
7. 待到所有Map-Reduce任务都完成, 将结果传送给调用方(当然,有的时候是调用方,有的时候是调用方指定的回调函数,有的时候可以是邮件系统,web提示,电话,短信,etc...)

#### Master节点的数据结构

Master节点需要保存其他节点的状态,暂存一些Map节点回传的信息,负责结束回调的调用-(因此,最好给高一些的配置,考虑到完全中心化的设计,定期CheckPoint,日志记录备份,主从多节点备份,都能缓解崩溃的风险)

#### 子节点的失败-重试机制

只要子节点向主节点的汇报超时,认定为其失效(有时,这种情况是机器宕机导致的,另一些时候可能锅在严重的硬件性能下降,比如硬盘即将宕机),立刻将其纳入失效名单,其任务被重分派到其他节点,依赖其的节点被替换.

#### 本地性

Map阶段的中间文件太多($M*R$个),并且文件普遍很小(64MB的块,哪怕分成64块,每块也只有1MB),存到GFS内部很浪费;但是Reduce阶段的输出就比较大,可以存到GFS这种分布式存储中,交付给调用方.

### Refinements 改进

#### 自定义哈希函数

有时可以对哈希函数作一层包装, 提供一个自定义的哈希来取代哈希函数

#### 更强的输出格式保证

虽然最终只要求输出一系列的key-value对, 但是对其进行更强的约束,比如要求输出的key-value对按key排序, 则能提供对用户更友好的体验

#### 聚合函数 Combiner Function

有些时候Map函数的产出物中存在大量相同的value值(典型例子: word-count任务中存在大量只出现一次的单词),此时可以将其压缩到一起,以节省带宽.

注: 也许更好的办法是采用一套压缩算法

#### 输入输出类型

其实很灵活,如果可以放弃一些兼容性的话,甚至可以互相传二进制对象,还能用上压缩算法(甚至还能考虑硬件加速压缩算法)

#### 本地开发调试

借助良好的抽象,本机环境搭建一个MR用于debug也不是什么难事

#### 应对用户的bug

有时Map,Reduce-Function本身就有bug,再出现明显异常的情况下,比如大量出现不寻常的错误,则应该立刻调用告警回调

#### 监控信息

主节点保存了大多数信息,因此,整个系统对外提供数据全仰仗主节点.

#### 计数器

子节点可以将一些关键数据定时回传到Master节点,比如Map的key数量,value数量,Reduce的key数量等作为监控指标.

### 实现细节改进

最基本的实现是先执行所有Map任务,等待所有Map任务完成后,执行Reduce任务.

在这里,所有任务可以向一个"全局任务中心"进行注册,注册一个Master节点用于判断节点互相独立的ID. 这个全局任务中心由于其实只需要是一个加了锁的随机数生成器,可以很稳定.

Map任务的输出相对输入来说规模较小,因此可以将其输出到SAS或者SSD等高速存储上,方便读取.

整个Map-Reduce任务中的读取,写入都是顺序写,顺序读,因此可以充分发挥高性能存储的能力.

Map-Reduce任务自身的基础实现是C++版本, 依赖编译的库动态下发到节点上链接执行; 有时可以使用更动态化的方案来解决,比如传递lambda,采用Java的动态编制类的方式,传递JIT之后的代码等等操作.

### 总结

Map-Reduce现在来看也不过时,整体来看非常完整,借用函数式编程的概念,将问题分解之后又汇聚起来,解决大数据下的问题.

但是其为了兼容性, 采用unix风格的全文本格式作为中间状态, 现在看来有很大的改进空间,

在此之外, 如果能够保证Reduce函数的 "聚合性"(对k1-list1,k1-list2操作后,对其结果result1,result2,进行k1-list{result1,result2}操作,与对k1-(list1+list2)直接进行操作等价,则可以在执行map的过程中就执行reduce,也许会有加速效果)

由于默认采用C++实现, 子节点需要靠胶水语言粘合起来(估计是cpp调shell调cpp),不如动态语言灵活(当然，这也许是性能考虑)

## Google File System 总结

### 假设

上面也提到了, google file system(下简称GFS)认为

1. 节点失效是常态, 需要动态恢复-撤掉损坏的机器,集群应该能在水位稍稍上涨的情况下维持现状,上了新机器之后能够恢复.
2. 文件都是比较大的, 至少也得有64MB, 优先考虑大文件的性能.
3. 支持大容量连续读,小容量的随机读,追加式的连续写入(而对于随机写入,只是说可以有,但是解决方案不完美,只给个可行方案),
4. 支持原子性的文件追加(客户端对锁无感知),并且需要高效(因为主要是生产者-消费者模式在用)
5. 比起延时,追求吞吐量.
6. 由于系统内部的设计与普通文件系统并不一致(比如普通的文件系统中,小文件更多),因此不需要完全接入posixAPI,还能省的有人误用.

GFS提供create,delete,open,close,read,write, 以及snapshot(快照),Record Append(客户端无感知的原子追加)

### 集群的组成

客户端自然不必多说, 服务端方面, 主要有两个职责,Master节点为主节点,负责元信息,全局存在一组(因为可能有一主多从),Chunk Server为存储节点,可以由非常多的节点.

GFS中存储的基本单元是Chunk,大小64MB(作为对比,文件系统中的块大小基本都是KB级别的),文件被切割成一个个的Chunk,由Master创建后,赋予全局(这里当然是Master节点范围下的全局)唯一Id,交给Chunk Server存储,并且每个Chunk还都另有备份,成为replication

Chunk Server将其存储在自己的磁盘上,并定期向Master发送心跳包保持活跃,汇报元信息.

### GFS的Master节点

所有的客户端都会优先访问Master节点,从中获取信息, 然后再被分派到各个Chunk Server上获取,或者修改. Master节点保存了所有的元数据, 为了速度,所有信息都保存在内存中.

这样可能会让扩展性受影响吗? 一个块64MB,对应的metadata却不到64bit,就算是64bit,之间也有10^6倍的关系, 以一个正常服务器128GB的容量来看, 可以支持128EB容量的数据, 这已经是天文数字了. 更别提还存在更大容量的内存.

为了防止Master宕机立即阻断服务, 需要有一主多从(但是没有从=>主的跃升, 需要手动恢复主节点), 为了防止一主多从挂掉, 需要有可重放的日志,为了加速重放,需要定期checkpoint. 不过当master重启时, 对应的chunk位置需要去轮询chunk-server,因为chunk-server位置占用的数据量有些大, 而且双方同时宕机可能性太小了.

### 数据一致性

我们从假设里可以看出, GFS高度重视追加写入,对于随机写入只提供可行性,不提供一致性保证; 而追加写入则可以保证 "至少写入一次",这对于有起始符号和终结符号的上层应用来说足够了.

### 操作细节

#### namespace 修改

创建,删除这种操作都是通过目录锁,文件锁实现的, 在master节点完成, 很正常,不说了

#### 读取文件

上面提到了, 只要忽略随机写入这一功能, 对于追加写至少有一次, 要读取的时候Chunk之间是平等的,只要向客户端返回Chunk列表即可,客户端随机选择一个去访问

#### 随机写入文件

Master将对Chunk的所有副本间的同步任务下放到Chunk Server,选择一个副本作为"Primary",交给它所有副本的信息,随后令Primary自行进行修改.

客户端向Master要数据,但是这次因为是修改,有了主从之分, 所以会返回Primary和其他Chunk Server信息,Server给Primary信息, Primary自己排序,分发给其他Chunk Serer再返回.

这个情况下,Primary上就没成功会返回失败,Primary成功,其他的没有完全成功会返回错误, 全部成功则为成功.

其实这里论文分析的并不是太好,因为有一些涉及 ,为什么会出现随机写会不稳定的原因没有分析

#### 顺序写入

流程大概一致, 不过追加写入可能会超过块的大小,此时会触发重传

#### 文件快照

基本思路是写时复制,由于基本是追加写入为主,所以没有写时,自然也就没有复制.

快照后, Chunk并不是立刻创建, 而是要等到写入才创建, 在这之前, 只是单纯将其链接到原有的块上,读取相同数据.

PS: 不过都要生成快照了, 自然随后的是修改,但是修改的话,只要是追加,也只是修改最后一个块.

#### 删除文件

就像一般服务器上都会禁止直接rm -rf,而是用垃圾桶+mv方式一样, gfs也是不直接删除,而是将数据重命名为特殊名称,等待周期性扫描时删除; 这样便可实现 有限度的回撤删除.

扫描的过程中可以执行的操作就比较多了, Master节点可以对元信息进行修改, 随后通知Chunk Server,Chunk已废弃的消息.

### 备份管理

备份在稳定性上,自然是越多越好,但是考虑到成本与容量问题,还得有限,一般是3副本. 每个副本之间为了隔离风险, 距离越远越好, 不仅不能同磁盘,同机器,最好交换机,电源供应都不是同一个.

创建副本会有三个时间点: 创建chunk,chunk备份,备份均衡(比如突然某个机器挂掉了,备份自然少了)

### Chunk Server的高可用

Chunk server由于本身数量多,失效几率更高. 失效后Primary会负责均衡

primary分配时有时间戳印记, 并在之后的操作中进行更新,失效后的server不会更新, 倘若恢复, 则会触发印记失效, 自动被移除.

#### Chunk Server的内部实现

Chunk Server内部会将块切分成更小的单位,并给每个基本单位计算校验和.若发现对不上(有些时候是读取时发现的,有些是随机检查时发现的),则上报master,弃用块,启动均衡.

### 总结

Google File System通过一个中心化的系统,构建了一个针对大文件优化的分布式存储系统,通过放弃对随机写入的追求与posix兼容性, 以及对文件追加的用户无感知实现, 实现了一个低成本的高稳定性存储系统,虽然其整体代码闭源,且不对外放出,但是还是能从中架构里获取到Google对自身架构的清晰认知与权衡.