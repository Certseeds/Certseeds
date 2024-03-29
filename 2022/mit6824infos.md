---
author: "Certseeds"
date: "2022-09-04"
title: "mit6824infos"
description: "mit6824infos"
tags: ["go", "mit6824"]
---

# Basic info for mit6.824-2022spring

## 结构

1. 读论文应该按照[https://pdos.csail.mit.edu/6.824/schedule.html](https://pdos.csail.mit.edu/6.824/schedule.html) 这个时间表来,每次meeting前把论文读完,读完后,上课前一天回答一些问题证明理解了.
2. 每两周一次编程练习,都会单独进行,并不希望将其公开(?)

mainly refer from [https://pdos.csail.mit.edu/6.824/general.html](https://pdos.csail.mit.edu/6.824/general.html).

## week01

### preparation-read Map-Reduce

paper link: <https://pdos.csail.mit.edu/6.824/papers/mapreduce.pdf>

#### 3-模型

``` log
map-reduce.
map: an k-v pair => a set of k-v pairs
the mid program: group k-v pairs by lots of map func by k, then will be set<key,set<v>>, send them to reduce.
reduce: k and set<v> => zero or one value
```

example:

``` log
map(file_name: string,file_content: string){
    for word in split(file_content,' '):
        EmitIntermediate(word,'1') # 这样实现最简单,状态无关,不需要考虑前后
reduce(key: string,values: Iterable<string>){
    result: int32_t = 0
    for value in values:
        result += parseInt(value)
    return Emit(to_string(result))
}
```

Conclusion:

+ map的类型是`(string,string)->iterable(string,string)`
+ reduce的类型是: `(string,iterable(string))->iterable(string)` 此处存疑.

input data be split into a set of `M` splits.
reduce 会把一个key对应的values,通过分块函数分割成为`R`块.分块数量,分块函数都是用户定义的.

#### 4-实现

1. map-reduce库分割输入为16-64MB的块,启用子进程.
2. 随机产生一个master,M个map-task和R个reduce-task.
3. 对每个被派遣了map-task的worker,读取对应的input-split,解析k-v对,分派给map函数,产物的k-values放内存里
4. map-task把产物通过hash(key)分割成R块,存到本地. 并将存储位置发回master,master则将这些位置传给reduce-worker.
5. 对被派遣了reduce-task的worker,通过rpc调用读取map-worker写入的磁盘数据. 一旦一个reduce-worker读取了全部数据,就会按中间key进行排序,因此key相同的自然而然地就group到一起.
6. 对于reduce-worker,按之前group好了的k-values,对每个k-values调用reduce函数,输出被添加到reduce-partition.
7. 当所有map-worker,reduce-worker都完成了的时候,唤起用户进程,回传数据.

这里有一些次级结论.

1. 输入被分成M个块,每个map-task完成1个就结束,产生$M_{i}{1}->M_{i}{R}$个子块.
2. + map-task全部完成后,不考虑master to reduce启动后的沟通的话,此时才能开始调用reduce函数.
   + 相反, master to reduce之间存在轮询关系的话,就可以异步的执行.
3. map-task,map-function; reduce-task,reduce-function两两一组,分别对应高-低.

master进程是有状态的,需要存储

+ M个map-task,R个reduce-task每项任务的完成情况.
+ worker的状态,是否空闲?在进行什么工作?
+ 完成了的map-worker把数据分割成R块,分别放在那里? `[M][R]`
+ 完成了的reduce-worker把结果存在哪里? `[R]`

为了监控状态,master需要监控workers的状态,如果一段时间内无响应则判定为失败,将其任务重派发给其他的worker. 考虑到大多数的map,reduce function是确定性的,重新派发不会影响结果. PS: 对于不确定性的,只能提供更弱的保证,"可能"可重复,"可能"不行

从上文的worker-task的数量同样是不同的,一个worker会在完成一项task后恢复状态,被重新指定task任务.

worker(计算资源消耗者) < Reduce-task数量 < Map-task数量
Example: 2000机器,5000Reduce-task,2*10^5Map-task

为了加速计算,调查后发现经常会出现一些task虽然一段时间内有反应,但是执行这项工作很慢; 当所有work进入到一个阈值的时候(比如还剩x%的worker没有完成任务),会启动备用Worker与其同步计算,因为上面说的确定性,所以这俩那个快用哪个,也不会影响到因素.

#### 4-实现的细化

hash-function通过影响数据分块,进而影响最终输出文件的逻辑;如果产物不进入下一个map-reduce,而是直接输出的话,可以优化下hash-function,从而方便阅读.

中间产物排序,对有序的输出文件有效? 4.2 这里不太理解

聚合函数,通过复用reduce函数,但是调用时机不一样,不在reduce-task里,而是在map完成之后,拆分输出之前(或拆分完成,写入之前?).可以节省带宽,加速reduce工作.

辅助文件的生成应该由编写者来确保.

有能力的话建议给master进程开一个http-server,用来动态的向外展示执行状态.

counter: 一个计数器,master掌管,可以一定程度上反应进度.

#### 5-性能

10^10 个100bytes的records, 找一个少见的three-character pattern(在92337个record里面存在).
M=15000,R=1. map任务在150秒左右执行完毕,读取速度最高峰出现在50秒左右,先增后降.

而排序任务则是对10^10 个100bytes的records排序,map函数截取10byte排序,reduce原样输出.
M=15000,R=4000; 读取大概花了200秒.

+ input只有一个高峰,因为中间文件写入而变慢.
+ shuffle任务有两个高峰,我认为是因为reduce-worker比reduce-task少,所以第一个高峰是第一批reducer从零开始读取,到所有reducer都读取完毕结束; 第二个高峰从第一批reducer-worker出现结束,新的reduce-task读取而开始.
+ 输入从shuffle的低谷期开始增长,一个尖峰直到最后结束.

备用进程很大程度上消灭了长尾效应,高效提速.

#### 6-7 总结与经验.

map-reduce是非常好的一层抽象,其消除了错误处理,并发,横向拓展等功能,并借助Map-Reduce的拓展性,将任务拆分成层,方便管理与维护.

### 问题部分: 暂无?

### video

<https://www.youtube.com/watch?v=WtZ7pcRSkOA> done

### lab

lab理所应当的是map-reduce的简单实现,先介绍一下输入输出,架构，再分析下实现和测试，最后分析下难点。

首先要定义一项任务的输入和输出, 将一组文件名(字符串)输入给server端，将要执行的map-reduce的动态库输入给worker;  server-worker之间通过预设好的管道进行rpc通信. worker的中间文件使用统一的命名风格,输出风格同上,输出路径都在执行路径.

在串行情况下,情况变得很简单,串行的执行读取所有输入,将所有的内容从文件里面读入,按行map,收集起来全体reduce,输出. 因为map,reduce都是稳定的,所以串行的输入确定了,输出也是确定的,很适合对拍用.

架构上来说, 是

``` log
Server-Main ---invoke---> Server --
                              |connect|
Worker-Main ---invoke---> Worker --
```

两个main方法都比较简单,主要是读取,校验标准输入,以及定义Server,Worker对外暴露的实现.

需要实现的是Server,Worker,以及两者之间rpc调用所共享的一些方法.

比较合理的主要流程如下:

1. Server启动,接收本次需要处理的文件.
2. Server阻塞, 直到有Worker接入
3. Worker探活阶段,探活无法链接则重置其任务,链接活跃但是没有进度则pass,链接返回成功则标记任务成功,标记Worker为可用.
4. Map派发阶段开始,并行的(必须)给Worker派发任务.
5. Reduce派发阶段开始,并行的(?)给Worker派发任务.
6. 收尾阶段,并发的Kill Worker
7. 退出.

2有单独携程处理,3在4567之前,3之后有一个探测本轮动作的操作,决定本轮要做什么.

#### 状态与无状态

server端要明确的一点是, server端不能无状态,它不能只等worker来触发(靠计时器的话会非常麻烦),要有自己的主事件循环.

主循环一轮一轮的反复执行,探测本轮状态,等待worker接入. 那么Server靠主循环有了状态,Worker还需要保有状态以及对外沟通吗? 实际上不需要了

Worker只需要向Server"注册"自己,并实现几个关键的几个调用(探测存活,派发map,派发reduce,获取map结果,获取reduce结果), 将自己实现为一个异步的服务.

PS: 更好的是,这样实现只有Server本身的状态复杂,只需要调试它; worker看看日志就能明白发生了什么.

#### DataRace,同步与Channel

可能是泛型出现的太晚了,Sync.Map直接用起来无法指定类型,用起来很难受,并且很难把控多个操作捆绑在一起的原子性, 但是不用的话又会出现data-race的情况,这种情况下怎么解决呢?

go中经典的解决办法: 通过将对一个对象的获取和更新丢进一个协程内,定义好这个协程for-select中的channel,则可将不同协程中的操作,转化成对这个对象的同步操作,在实现上还非常类似同步.

如果状态比较复杂,输入之后还要用返回值的话,无非也是多规定好某个channel负责给协程传递信号,另一个协程自己负责写入,调用方读取罢了.

这样实现后,将Sync.Map的调用转化为对map[key]value的操作,降低了类型记忆的难度; 可以将同步代码转写成多个处理协程+一个读写协程的配合,并发执行起来效率翻翻.

#### 测试

原始的测试脚本太长了... 把所有的测试全都写成了一个大脚本, 是可以共用一部分代码,但是也让单独调试非常难受.

因此,将这部分内容都单独拆分到了Makefile中,makefile对依赖的良好支持,正好对这个复杂度下面的编译和测试比较适合.

为了能一眼看出编译产物的性质,特地把可执行文件都用.exe后缀, 虽然看上去像windows, 也无所谓了.

另外,为了提升调试的体验,这次尝试了用原生的log(应该是原生的吧? 毕竟路径只是"log"),只往console打印的话,效果还可以.

#### 难点

1. 确认server-worker的架构
2. 正确处理并发data-race问题
3. 拆分测试,鼓捣出调试环境.

## week02

这周主要是语言学习, 虽然不清楚为什么这不是第一周的任务, 但是总比没有好.

+ MIT 6.824 之前的选择是C++, 之后为了更好的聚焦重点, 选择了go这门多线程(纤程也算吧)+垃圾回收的语言, 原生的RPC库更方便使用.
+ go routines默认是并行的, 当然, 这也是建立在有多核的基础上的. 如果核心数量< 开启的goroutines数量, 通过分时复用来解决问题.
+ go的chan这个内建类型不是一句两句就能说通的, 内建在runtime里.

+ goroutines 是golang版本的线程
+ 事件驱动是线程的取代品?? 有一个大的事件循环, 循环中检查新输入, 把事情处理到下一步, 然后更新状态.

PS: 本周由于大部分都是比较简单的对话,说明类内容, 没什么工作量, 同样也没什么可以详细描述的.
