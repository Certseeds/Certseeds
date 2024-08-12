---
author: "Certseeds"
date: "2024-08-10"
title: "使用包管理器下载并使用whisper"
description: "download and using whisper via python-package-manager"
tags: ["python", "package-manager", "ASR"]
---

# 使用包管理器下载并使用whisper模型

本文主要包括使用包管理器下载并使用whisper的一些笔记.

## openai-whisper

主要是尝试使用poetry来在windows系统上安装openai-whisper, 希望能尽量使用上层命令.

1. torch安装速度问题

torch-cuda非常大, 所以它不在pypi镜像源上, download.pytorch.org上大概需要2个小时下载完.

由于torch和torch-cuda共享依赖(cudnn之类的依赖怎么就能在pypi上呢..., 他们也都挺大的, 怎么就你个pytorch特殊), 所以一个常见小技巧:

使用pypi-mirror下载好cpu版本torch, 再使用`poetry run pip install torch==${version}+cu${cuversion} -f ${pypi-mirror}`来安装torch-cuda.

这样也会带来另外的问题: poetry会发现torch的版本改变了, 进而在改动依赖时企图自动将其"update"回去, 所以搞好之后尽量别动了.

+ 备注: 似乎`poetry run pip`下载到的包会被poetry缓存, 因此先`poetry run pip`下载torch-cuda, 再`poetry add --source pytorch-gpu-src "torch=2.3.1+cu121" -vvv`就能跳过下载阶段, 直接安装. 后续就不会担心不能update
+ 备注2: 如果poetry能提供下载过程中url改写功能的话, 可以将`download.pytorch.org/whl`给rewrite成镜像站的地址, 这样就不用绕过poetry用pip了.

2. 执行问题

poetry可能是按名称搜索venv/base路径的, 用`poetry run python3`就用的是base的python3, venv内没python3, 需要`poetry run python`

3. 可执行文件

注意`./.venv/Scripts`下面不同平台executable的区别, windows下是`.exe`, 写脚本得用`whisper.exe`

## faster-whisper

注意到本项目最新的release是1.0.3, 但是最新版本实际上给出了一个很有诱惑力的功能: 并发解析加速推理, 所以实际上需要用最新版本.

README里说的可以用 `export LD_LIBRARY_PATH=python3 -c 'import os; import nvidia.cublas.lib; import nvidia.cudnn.lib; print(os.path.dirname(nvidia.cublas.lib.__file__) + ":" + os.path.dirname(nvidia.cudnn.lib.__file__))'`来引入cublas, cudnn是不假, 但是当引入了torch=${version}-${cuda_version}之后, 会发现torch自己就会把nvidia这一大堆lib管理好, 所以实际上可以不设置, 装完了torch就能跑.(PS: 至少wsl2里面是这样)

随后, 模型转换这部分没做, 因为要引入一个transformers[torch], 虽然可以用dev依赖引入, 但是感觉有点复杂, 直接用了hgface的模型.

体验的感觉是, fastwhisper速度快, 对拟声词的识别也不错, 但是每个句子都太长了, 也许可以用segment.words里面是否包括句号来帮助判断句子的边界.

批量处理时虽然显存用量上涨, 但是利用率没怎么变, 功率也没怎么变, 优化的好.

## poetry

本次安装pytorch的过程中遇到了一些坑.

### 直接301源站的镜像站

在poetry使用时, 会发现无论是直接不设置从download.pytorch.org下载, 还是设置了镜像站, poetry都是一样稳定的龟速, 256kb/s, 难以令人接受.

源站下载慢很正常, torch看起来只在第一世界做了针对性优化, 其他地方都有下载慢的情况, 但是镜像站为什么也会这样?

打开verbose可以发现, torch在第一次访问时就被301走了

虽然文档上是这么写的

> pytorch-wheels 是 PyTorch pip 源的镜像。直接将 PyTorch 安装指引 中的 <https://download.pytorch.org/whl> 替换为 <https://mirror.sjtu.edu.cn/pytorch-wheels> 即可。
> refer from <https://mirror.sjtu.edu.cn/docs/pytorch-wheels>

但是实际上, sjtu的版本只适合这么invoke `pip install torch==${torch-version} -f https://mirror.sjtu.edu.cn/pytorch-wheels/torch_stable.html`

比如<https://download.pytorch.org/whl/cu121>这样的链接, 直接就给301到源站上去了, 也就是说, poetry在下载时, 第一个请求之后就都直接走源站, 而不是镜像站, 不开verbose还完全看不出来.

虽然能通过pip下载缓存, poetry再读取来绕过问题, 但是还是不太好用, 值得优化.

可以猜测原因, 一个有说服力的理由是, pytorch镜像站给的都是相对链接 `href="/whl/cu121/torch-2.1.0%2Bcu121-cp310-cp310-linux_x86_64.whl#sha256=0d4e8c52a1fcf5ed6cfc256d9a370fcf4360958fc79d0b08a51d55e70914df46"`
这个和`pytorch-wheels`前缀是不一致的, 导致要完美兼容要改写url, 而镜像站感觉这个改写没啥意义, 就只把包给同步下来, 像是 `/whl/cu121/torch`这种目录结构就都直接301了.

### 换源

直接贴一个最佳实践

``` toml
[[tool.poetry.source]]
name = "tsinghua"
url = "https://pypi.tuna.tsinghua.edu.cn/simple/"
priority = "primary"


[[tool.poetry.source]]
name = "aliyun"
url = "https://mirrors.aliyun.com/pypi/simple"
priority = "supplemental"

[[tool.poetry.source]]
name = "pytorch-gpu-src"
url = "https://mirror.sjtu.edu.cn/pytorch-wheels/cu121"
priority = "explicit"
```

primary主要访问, supplemental只有主没有时才访问, explicit只有显式指定时才访问.

### venv

poetry默认会集中式的存储venv, 不把集中式的删掉不用本地的venv, init项目之前最好先本地建一个`./.venv`
