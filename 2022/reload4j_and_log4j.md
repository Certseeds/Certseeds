# reload4j_and_log4j

近期频繁被ide提示log4j有安全风险,但是`log4j:log4j`这个包没有后续更新了,因此也就断了更新的想法,近期发现居然有维护者在维护log4j,虽然包名改了,但是包体不变. 提起兴趣来想要记录一下log4j这个项目的兴衰.

## 时间轴

log4j1由 [Ceki Gülcü](https://github.com/ceki) 在2001年一月8号启动, 开始的时候用svn开发,2011年左右转换成了git. 开发途中,项目的管理权给了Apache基金会,原本的作者基本上不再干涉了,比如最后一个版本的[tag](https://github.com/apache/logging-log4j1/releases/tag/v1_2_17)都不是他本人发布的,而是另外的维护者.

+ 2002年五月17日发布了[v1_2_1](https://github.com/apache/logging-log4j1/releases/tag/v1_2_1)
+ ... 之间发布了一系列的tag
+ 2012年五月26日发布了最后一版[v1_2_17](https://github.com/apache/logging-log4j1/releases/tag/v1_2_17)

+ slf4j第一个有意义的提交在2005年4月15日,初始化,[提交了少许有意义的文件](https://github.com/qos-ch/slf4j/commit/98b7fa747c6dc1613f2b733c887f7de9164a00a4)
  + 这个时间点已经在用git开发了
  + 适配了jdk14(指1.4)等几个output
+ 第一个有意义的tag发生在2009年8月21日,发布[1.0RC4版本](https://github.com/qos-ch/slf4j/releases/tag/SLF4J_1.0RC4),对应的提交是2005年12月27日
  + 这个时间点至少还是有JDK1.4的,毕竟有jdk14这样的适配器

鉴于slf4j的这个提交时间点,感觉slf4j是希望作为log4j1的api来实现的,毕竟log4j1出现的时候没别的日志框架,当时主流的编译工具还是ant,编译流程需要手动写在`build.xml`里面. 作者开始时大概是认为可以将其作为公共的日志库,类似于cpp里面的库被标准化进入stdlib. 但是jdk1.4内java.util.Logging这个玩意引入后意识到,大概标准化已经没啥可能了,于是开始手写一个兼容库

## 竞争,slf4j与common-logging

令人震惊的是,commons-logging本身起源很早,居然是2001年8月,而且看样子log4j本身被apache基金会拿到也是一个很早的事情. 最初的一次提交内,log4j就已经是 `org.apache.log4j`这样的包名了.

common-logging本身是一个包装器,自己带的实现非常简陋,也就是能用,离好用还有很远. 考虑到这两个项目开始的时间这么接近,有理由认为最开始的时候,log4j&common-logging是互相搭配的,common-logging作为接口,log4j作为实现,两者一起搭配.

2005年4月10日,出于未知原因,log4j的作者Ceki决定不再使用common-logging作为接口,而是自己写一个接口,这个接口不需要再考虑apache基金会,相对来说更自由了.

两者相对比,最显著的改变是: slf4j终于支持了占位符格式化,因此可以不再使用`""+String+""+int+""`这样蹩脚的写法了,终于能在输出前就看到要输出的格式本身了.

## logback,log4j被弃用与log4j2

logback本身也是Ceki写的,开始于2006年8月6日,这个时间点log4j还在更新,我不觉得如果他可以把控整个项目的话,会选择重新开始搓一个项目.

+ log4j本身开发时没考虑到外部接口这回事,是接口来适配它,而不是一起配合.
+ log4j测试不够,并且显然开发者对添加测试没什么兴趣.
+ log4j对兼容性要求有点高,直到最后一版本还在兼容JDK4
+ log4j的把控权限不在作者手中(最重要的是这个吧...)

所以Ceki对log4j1.x带来了大量改进,造就了logback.

log4j1一直维护到了2012年,停止了几年之后,2015年宣布不再开发,并开启了新项目log4j2.

log4j2原生就把自己拆分成了api和core实现,可能是构建工具转向maven了,多模块开发不像之前那么难了, 后来还基于java8的lambda表达式,把slf4j的占位符格式化进一步拓展到了闭包执行,把一个仿函数传给logger,符合级别才调用,不符合级别直接忽略. 可以明显降低传参过程中高耗时操作的占用.

并且log4j2不再支持jdk4,终于能用jdk5并发特性了,把log4j1.x里面的死锁问题给搞定了.

很有趣的是,对于旧版本JDK的超长期支持到底是锁死log4j1的原因呢?还是有需求要这么操作呢? 感觉没人能说得通.

## top15 vs top53 log4j2为什么没人使用

[log4j-mvn](https://mvnrepository.com/artifact/log4j/log4j)

log4j是mvn仓库上下载量排行次高的日志实现库,排名15th,前面的是slf4j这个接口(2th),logback这个springboot的默认日志库(6th), 而log4j2则被甩在后面(53th).

不是很看好log4j2后续的增长,主要是log4j2的这一波漏洞太严重了,别人都听风就是雨,都被吓走了,哪里还敢继续转到log4j2.

log4j2支持多种配置文件,xml,json,yaml,properties,但是很令人迷惑的是,即使是多种格式,但是语法实际上并不兼容log4j1...

哪怕是按后缀兼容也好,这是故意要制造迁移成本吗...

## 安全风险与无限期的维护成本

TODO,按reload4j的更新来分析下log4j1之前存在的问题与可能的安全风险.
