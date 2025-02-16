---
author: "Certseeds"
license: "CC-BY-NC-SA-4.0 or any later version"
date: "2021-08-28"
title: "如何管理Modern Cpp项目"
description: "how to management modern cpp project"
tags: ["cpp", "software_engineering"]
---

# 如何管理Modern Cpp项目

最近主要在看一个历史比较久远的C-C++(后简称C++)项目, 虽然早就知道C++的依赖管理, 本身架构布局管理都是大坑, 还是没想到坑能被踩成这样.

因此, 本文计划通过对一系列库的分析, 得出Modern-Cpp项目的依赖管理, 架构布局最佳实践.

## 应该如何管理依赖?

C++中的依赖管理一直是巨坑, 由于C++几乎没有统一的, 被普遍支持的依赖管理工具, 出现了各式各样的解决方案.

### 只要没有依赖 就不需要管理依赖

当然, 纯粹意义上没有依赖的项目很少, 如果单纯的不引入任何库, 几乎无法做任何事情.

如果把 `没有依赖`放宽到`没有第三方依赖`-也就是允许引用标准库的话, 事情会容易许多

也许Linux-Kernel是践行这个原则最彻底的项目, 毕竟内核是特殊的存在, 纯C项目也没有STL库可使用.

但是这毕竟是特殊情况, 绝大多数情况下无法像内核一样想要实现功能就自己开发, 成本太高, 消耗人力物力太大.

**优点**: 一劳永逸
**缺点**: 人力成本太高
**编译过程**: 直接

### 依靠系统的包管理系统管理依赖

严格来讲, C++的标准库内置在了系统内, 其实也在被系统的包管理系统所管理.

撇开这些不谈, 只讲标准库之外, 但是又被系统包管理系统所管理的那些库.

举例: OpenCV所依赖的`ffmpeg/libav`库, 并不在opencv主仓库中保有任何代码, 只是`3rdparty`目录下有个文件夹, 并且提了一句`On Linux and other Unix flavors OpenCV uses default or user-built ffmpeg/libav libraries.`

ffmpeg是一个比较稳定, 同时应用广泛的库, 基本上各个linux发行版的包管理系统都会有ffmpeg.

在这种情况下, ffmpeg一般从远端以动态库形式被包管理系统下载到本地, 发行版自己已经做过兼容性测试, 确保系统源下载后就可用.

(不过ffmpeg将自己的多个组成部分(比如libavcodec-dev, libavdevice-dev)都拆分了出来, 没有一个统一的`libffmpeg-dev`来供下载.)

这一方面OpenCV自己做的就很好, 既有`libopencv-core-dev`, `libopencv-calib3d-dev`这样分拆出来的包, 也有`libopencv-dev`这样的整合包.

**优点**: 依赖的包不需要自己编译, 发行版负责这项工作.
**缺点**: 依赖于包管理系统, 依赖版本有可能会随着发行版不同而改变, 从而产生不可预料的问题(小版本号, 补丁号升级通常不换名字);并且依赖的包的名字也会随着发行版的不同, 以及发行版的升级而改变(比如依赖libpng12, 后来系统内这个包没有了, 变成了libpng16)
**编译过程**: 先跑`deps_install.sh`进行依赖包下载, 然后直接编译

### 将依赖的代码纳入版本管理

这里又分为几种不同的类型

#### 直接将依赖的项目作为子模块放到版本管理中

实践这一条最充分的莫过于[boost](https://github.com/boostorg/boost), 其[.gitsubmodules](https://github.com/boostorg/boost/blob/master/.gitmodules)内足足有159个(截至20210828)submodule, 每个submodule都链接到子模块的某一个提交.

这样的好处在于

+ 确保子模块是一个完整的库, 可同时供给多个仓库引用
+ 确保仓库引用的是子模块的一个**镜像**, 日常对子模块的开发(可能是一路追查bug追查到依赖内)不影响仓库本身, 只要主仓库不变更, submodule不会变化.
+ 确保统一编译环境, 不管是使用`make`还是`cmake`, `xmake` 都能够确保最终都是在同一个环境下, 同一个流程中进行编译

当然也有不好之处, 比如操作复杂, 切换分支时需要手动切换submodule的分支.

**优点**: 编译环境统一, submodule可复用, submodule自己升级也简单, 合入对应仓库主分支即可.
**缺点**: 需要手动维护子模块的仓库, (万一)子模块的历史发生变更(比如发生了一次git历史重建), 可能存储的子模块镜像都消失了.
**编译过程**: 子模块有两个选项

1. 先跑`submodule_compile.sh`进行依赖包的编译, 安装到系统内(比如`/usr/bin`, `/usr/include`), 
2. 或者被CMake, XMake等当作target, 被自动安排在主仓库前编译

+ 然后直接编译(或者显式链接子模块中的target)

#### 直接将依赖的项目的代码放到版本管理中

典型案例: OpenCV所依赖的zlib, 主页[opencv-zlib](https://github.com/opencv/opencv/tree/master/3rdparty/zlib), 而[zlib主页](https://github.com/madler/zlib), 从中可见, 直接把zlib的代码搬了过来, 放到了版本管理内, 并且还删了几乎所有的文件夹, 只保留源码, 甚至还重写了[CMakeLists.txt](https://github.com/opencv/opencv/blob/master/3rdparty/zlib/CMakeLists.txt)

这样的好处在于

+ 简单, 方便, 快捷, 不需要任何额外操作就能确保依赖的正常编译.
+ 切换分支, 切换提交时依赖也会自动切换, 没有风险.
+ 可以在这个过程中对依赖本身动刀子, 比如上述的裁剪.
+ 方便对依赖进行debug, 修改

劣势也随之而来

+ 代码量膨胀, 需要管理的代码变多了
+ 没办法在项目间复用依赖
+ 对依赖的升级很麻烦, 需要复制-粘贴, 还要处理依赖方的目录变更, 以及对依赖做的修改与依赖本身的升级之间冲突的解决

**优点**: 简单方便, 切换分支容易, 可以定制依赖
**缺点**: 维护的代码量膨胀, 无法复用, 升级复杂.
**编译过程**: 子模块有两个选项

1. 先跑`submodule_compile.sh`进行依赖包的编译, 安装到系统内(比如`/usr/bin`, `/usr/include`), 
2. 或者被CMake, XMake等当作target, 被自动安排在主仓库前编译

这类情况下2偏多, 因为都已经动了裁剪的心, 为何不定制一下, 将其纳入编译管理中呢?

+ 然后直接编译(或者显式链接子模块中的target)

#### 特殊分类-HeaderOnly库

很显然, 依赖并不单纯指的是依赖静态库, 动态库, 由于模板的特性(模板需要实例化)与STL库中模板的大规模应用, HeaderOnly逐渐成为一些库分发的方式.

最典型的当属C++的标准模板库STL, 其他例子还有[Catch2:一个C++测试库](https://github.com/catchorg/Catch2)

还可以想象一下什么库可以这样分发?

+ 只有`const static`变量的库, 比如`PI`, `e`常量
+ 资源列表库, 比如只有一个`const static int *`, 指向一个巨大数组, 内部是一个巨大的素数表
+ 等等

这类库最起初是被模板特性所胁迫, 只能以Header-Only方式散发, 之后逐渐成为了一些中小型工具类项目的首选-毕竟可以不再(也不能)考虑什么二进制兼容性问题, 要用就加到`third_party`, 引入项目, 随后被编译工具链随着项目本身一起编译.

既然这样很好用, 为什么不都使用这样的方式, 只要大家都是Header-Only, 事情不就会好起来吗?

问题在于

+ Header-Only会使得代码编译速度成正比例速度上涨, 每引用一次库, 编译时就多了几千几万行代码, 一个个文件一次次的引用, 使得编译速度越来越慢

当然, 这确实解决了关于到底怎么编译依赖的问题: 将依赖作为头文件目录开放就可以了, 不需要关注链接.

#### 直接将依赖的项目的库文件放到版本管理中

其实这在其它语言里是很不可理喻的事情, Java项目不会把自己依赖的Jar包都放到仓库内, 但是C++项目偏偏就是有人会这么做

比如[Tencent-TNN-opencl依赖-lib](https://github.com/Tencent/TNN/tree/master/third_party/opencl/lib), 居然直接把动态库放到了仓库内.

1. 将二进制文件放入仓库, 会导致版本管理仓库体积迅速膨胀-二进制文件难以压缩.
2. 通常使用这类方式后, 对应的`3rdparty/${deps_name}`里面会只有`include`, `lib`两个文件夹, 这样看似简洁, 但是丧失了库与源文件之间的关联性, 负责任的开发者也许还会标注一下编译出库的环境(包括但不限于系统发行版, gcc版本, 编译选项), 对应的库的提交(commit-hash), 以及自己对第三方库做的改造; 短视的开发者什么都不留, 这导致对这个库的升级变成了一项玄学: 根本不知道到底之前是怎么编译出来的, 又应该怎么对这个`lib*.so`, `lib*.a`进行替换升级

## 一种可行的构建方式

简要介绍一些一种可行的中型C++项目构建方式, 目标是制作出一个Docker镜像.

### 锁定依赖版本

使用submodule方式, 没对上游进行修改则直接使用github源, 否则自己维护一个本地的${version}-patch分支, 记录好打上去的补丁.

### 构建依赖

最外层使用一层Makefile, 

``` makefile
DEPS_NAME_1: DEPS_NAME_0 DEPS_NAME_a
    $(BASH) ./third_party/DEPS_NAME_1.build.sh
```

中间层是`./third_party/DEPS_NAME_1.build.sh`

``` bash
#!/usr/bin/env bash
set -euox pipefail
main() {
    podman build \
        -f \
          $(pwd)/third_party/DEPS_NAME_1.containerfile
        --ignorefile \
          $(pwd)/third_party/DEPS_NAME_1.container.ignore
        .
}
main
```

这里`build.sh`, `containerfile`, `container.ignore`三个文件享有共同的前缀, 将他们指定为同一个依赖的构建脚本.

+ `build.sh`负责封装入口命令, 避免指令外漏到Makefile, 使得指令变更污染Makefile的git记录
+ `containerfile`负责封装底层构建命令, 使用容器机制控制隔离构建过程中依赖之间的互相联系, 只允许显式COPY其他依赖的二进制.
+ `container.ignore`负责将几乎其他依赖包排除出构建, 只允许依赖的源码进入仓库, 通过podman的构建缓存机制来cache构建结果.

+ 最底层为`./third_party/DEPS_NAME_1.containerfile`, 和最外层makefile共享相同的依赖关系.

``` Dockerfile
FROM prefix/DEPS_NAME_0 as DEPS_NAME_0
FROM prefix/DEPS_NAME_a as DEPS_NAME_a
COPY --from=DEPS_NAME_0 /home/DEPS_NAME_0 /home/DEPS_NAME_0
COPY --from=DEPS_NAME_a /home/DEPS_NAME_a /home/DEPS_NAME_a

COPY ./third_party/DEPS_NAME_1 /home/DEPS_NAME_1

RUN cmake \
    -S . \
    -B ./build \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_INSTALL_PREFIX="/home/DEPS_NAME_1/output" \
    && cd /home/DEPS_NAME_1/build \
    && cmake \
        --build . \
        --config Release \
        --parallel \
        -DCMAKE_INSTALL_PREFIX="/home/DEPS_NAME_1/output" \
    && make install \
    && tree /home/DEPS_NAME_1/output
```

最重要的是把install路径隔离在一个独立的文件夹中, 避免构建链出现不明确的依赖.

经过这样一个个的三件套互相依赖, 最终会形成一个Makefile的依赖树, 一个Containerfile的COPY依赖树.

### 维护上层应用的构建

没特殊需求的话使用Modern-CMake. 依赖库提供了`Find*.cmake`最好, 可以使用`FIND`系指令; 没有的话, 后退一步, 使用PkgConfig来读取, 还不行就手动构建`INTERFACE-Target`, 最后在CMake里面再组织一次依赖树.

最终外层应用的构建也可以用上面的三件套式构建法, 这里会出现大量的COPY语句(全是依赖), 也别忘了把install目标挪到`appops`目录下面, 只有库才会在/home下面.

## 结论

### 依赖管理

C++偏向底层, 天生不像Java那样, 编译出来的Jar包可以跨平台, `一次编译处处运行`, 只能实现源码级别的跨平台, `一次编写, 处处编译`, 想要绕过的, 最终都会吃更大的亏

最终结论:

1. 只要依赖较为稳定, 首选借助系统的包管理系统进行依赖管理, 提供一个`deps_install.sh`
2. 如果想要支持跨平台, 又或是想使用最新的依赖版本, 首选借助子模块实现版本管理
3. 如果有信息, 也有实力对依赖进行定制, 并且还有余力跟进依赖的更新, 处理本地与远端的冲突, 直接将依赖纳入版本管理中.
4. **绝对不要**将二进制包放到版本管理内, 企图这样实现`DevOps`
