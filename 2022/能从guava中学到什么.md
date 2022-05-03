# 能从guava中学到什么?

## README

guava将自己定位为 核心基础库, 因此README里从上到下可以分成:

+ simple-introduce
+ Adding Guava to your build
+ Snapshots and Documentation
+ Learn about Guava
+ Links
+ IMPORTANT WARNINGS

使用者从上向下看, 看到maven或者gradle的引入方式后可以想象,会有相当多的人直接复制,然后粘回自己的仓库.

只有那些有需求的会向下看.

此时,由于Snapshots and Documentation非常短,因此使用者将忽略它们

下一步,将会看到`Our users' guide`,从而导入到wiki界面, 这里包括更详细的简介,以及Contributor相关的细节.

## Wiki

guava的wiki中非常有意思的一点: HowToContribute放在了**最后**一条, 结合其中内容:

> Google实际上将内部库经过一定处理后通过脚本或其他手段, 定期同步到GitHub,而GitHub上的Pull Request则通过一定的触发机制,将提交发送到Google内部(可能是一比一映射到内部的Pull-Request机制?),由其员工手动批准.

此处可以发现,Google将其内部的测试,外部的测试严格分开了,内部测试应该是包含外部的,也不止外部的

~~感觉是在暗示对外部贡献不太欢迎.~~ OpenCV也是把这部分放最下面

## gpg-sign, Signed-Off-By 等

首先Google内部所使用版本管理工具并非市面上见到的Git,SVN. 因此谈论guava的gpg-sign实际上没什么意思, google内部完全可能完全基于对gmail的信任,不使用什么gpg签名.

但是, 假设Gpg-Sign是存在的, 那么只能说, gpg-sign到现在为止还没有成为共识,哪怕是google也不能强制所有开发者在提交中加入gpg-sign字段.

Signed-Off-By: `name`这个完全是基于提交信息的字段,虽然看起来完全靠自觉,但是在git的邮件工作流中, patch在邮件中飞来飞去的时候, 邮箱+gpg-sign+signed-off-by字段就能很好的进行协作, 再加上这也是一个比Committer,Author空间更充分地地方,能够填更多人名,所以有必要.

但是Google内部的工作流并不基于邮件,而是基于内部的协作流程-这其中显然存在鉴权机制, 再加上review这项工作也有工具来承担,实际上提交信息中就不需要包括太多元数据.

所以这一部分只能说google不想做,并且做了也没用,git上的gpg签完能不能导入内部库都是问题.

## 仓库结构

guava采用了一个很典型的monorepo式构建,
结构如下:

``` log
guava-parent
- [x] guava
- [x] guava-bom
- [x] guava-gwt
- [x] guava-testlib
- [x] guava-tests
```

1. guava-parent包括了大多数元数据,并将下属的几个加入了module
2. test部分单独作为一个module,这一部分很好理解,为了模拟用户dependency引入guava,因此,test也要将其作为一个模块来引入,而不是直接对着源文件进行测试.(换句话说,本身不作为lib发布的库没必要这么做)

这里令人迷惑的是guava-bom,guava-testlib这两部分,他们起什么作用?

## 构建与测试

这部分令人感到很奇怪,因为实际上guava并不能直接`mvn clean compile test-compile`: 其gwt部分会报错.

也许正是考虑到了这点,其构建脚本中的构建是:

`mvn -B -Dorg.slf4j.simpleLogger.log.org.apache.maven.cli.transfer.Slf4jMavenTransferListener=warn install -U -DskipTests=true -f $ROOT_POM`

测试则是: `mvn -B -P!standard-with-extra-repos verify -U -Dmaven.javadoc.skip=true -f $ROOT_POM`

PS: 并且测试可能和环境有关,actions里面的环境就没问题,本地需要调试.