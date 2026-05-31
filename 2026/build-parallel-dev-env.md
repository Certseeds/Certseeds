---
author: "Certseeds"
date: "2026-05-31"
lastmod: "2026-05-31"
title: "build parallel develop image"
description: "可以并行构建的开发镜像"
tags: ["notes", "experience"]
---

# 可以并行构建的开发镜像

随着 awesome-exams-page, vitebooks, 以及未来可能的 algorithm-template 这类依赖投入时间的项目的增多, 在项目中引入 claude-code 等 cli 工具变更越来越有必要. 需要使用 cli 工具来将 项目中繁杂的 "信息抽取", "规则校验"等步骤转移到脚本驱动的非交互式工作流中进行, 而非交互式工作流完全自主运行带来的风险就需要采取手段进行规避.

## 基于 apt 和 nvm 的工作流

最开始时我试图使用 openclaw + claude code, openclaw负责分发任务, claude code负责具体执行, 但是执行一段时间后发现这样效率很低.

首先, openclaw 是有状态的, 它需要后台起一个 process, 前台接入tui来执行, 这样就得单开一个cli来开着.

其次, claude code 的非交互式模式实际上输入也没有灵活到必须运行时动态决定, 只需要从另外一个claude code中总结出来, 实验几次就可以总结到 bash 内作为模板了.

这个阶段的工作流主要是使用的是一个简陋的 containerfile

``` dockerfile
FROM ghcr.io/certseeds/sshable
ENV nvm_version=0.40.1
ARG USERNAME="nanoseeds"
ENV NVM_DIR="/home/${USERNAME}/.nvm"
RUN export DEBIAN_FRONTEND=noninteractive \
  && yes | apt-get update \
  && yes | apt-get upgrade \
  && yes | apt-get install curl
RUN export DEBIAN_FRONTEND=noninteractive \
  && yes | apt-get update \
  && yes | apt-get upgrade \
  && yes | apt-get install sudo git \
  && echo "${USERNAME} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER ${USERNAME}
WORKDIR /home/${USERNAME}
RUN wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v${nvm_version}/install.sh | bash \
  && . "${NVM_DIR}/nvm.sh" \
  && nvm install --lts \
  && nvm use --lts
RUN . "${NVM_DIR}/nvm.sh" \
  && npm config set registry https://registry.npmmirror.com \
  && npm install -g pnpm \
  && pnpm config set registry https://registry.npmmirror.com
ENV SHELL="/bin/bash"
ENTRYPOINT ["/bin/bash"]
```

这个流程内, nvm下载流程网络受限, 并且 npm pnpm都得显式的配置, 虽然LTS版本能确定, 但是构建体验还是很差.

用这个镜像打开之后, 还需要

1. 下载 global claude-code-router
2. 下载 global claude code
3. podman cp config file to claude-code-router
4. podman cp config file to claude-code

把这一套安装结束, 配置文件调通就很费劲, 并且 claude-code-router 还是有状态的, 需要后台启动之后才能用.

在这之后还需要在 `pnpm install` 仓库级别的配置, 整体就一个麻烦, 把环境搭建起来就很费事.

## 陷入困境

上一个阶段还是在处理纯文本, claude code自己就够用了, 但是接下来到了需要接入 jupyter-mcp 的时候, 它在本地运行依赖 python 环境, 还依赖 python3 的版本管理工具.

uv自己也有脚本, 但是直接用脚本安装的话, 又是 `RUN wget {script} && bash {script}`, 而且又是一个网络受限的url, 下载就得好几分钟.

更别提由于`RUN` step之间存在前后依赖关系, 虽然后面的 stage 完全不依赖前面的 stage, 但是 podman 识别不出来, 前面的一变换, 后面的就得跟随下载.

把 node+pnpm, python+uv 的工作流搭建好之后, 这个容器一构造就得 10+min 起步, 中途还容易失败, 体验太差了.

## portable的二进制以及并行构建

被构建卡了脖子之后反思了一下, 以 `并行构建`, `走镜像源` 以及 `外置版本` 三个角度出发, 使用多阶段构建重构了镜像.

`并行构建` 就意味着完全不能走 apt 安装, 从 apt 源 install deb package and reinstall 也不行, apt install 过程由于得对某一个本地 db 进行中心化的记录, 无法并行; 每一个过程应该产出一个目录, 最后直接复制该目录到最终阶段就能用.

这里就可以用 `/opt/` 目录, 也符合语义.

`走镜像源` 就意味着选择并不是很多, cnpm mirror有个 binary 源, tuna 上也有 github-release 源, 以及可以考虑一些大而杂的镜像源(比如conda-forge), 或者是 pypi

`外置版本` 意味着要从 containerfile 内移除 fetch and parse json or xml 来拿取版本号的逻辑: 这些逻辑容易被缓存, 并且难以维护, 缓存还破坏 "fetch" 的语义. version 应该被注入到 ARG 内部, 由外部的脚本来决定

综合以上三点, 在 node + pnpm 中就可以体现为下面的脚本

``` dockerfile
FROM ghcr.io/certseeds/sshable:latest AS node-builder

ARG NODE_VERSION

RUN curl -fsSL "https://registry.npmmirror.com/-/binary/node/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.gz" \
  -o /tmp/node.tar.gz

RUN  mkdir -p /opt/node-lts \
  && tar xf /tmp/node.tar.gz \
  && (tar xf /tmp/node.tar.gz \
    -C /opt/node-lts \
    --strip-components=1 \
    --no-same-owner \
    --no-same-permissions \
      > /dev/null 2>&1 || true) \
  && /opt/node-lts/bin/node --version

FROM node-builder AS pnpm-builder

ARG PNPM_VERSION
ENV PATH="/opt/node-lts/bin:${PATH}"

RUN /opt/node-lts/bin/npm install -g pnpm@${PNPM_VERSION} \
    --registry=https://registry.npmmirror.com \
  && cp -r /opt/node-lts/lib/node_modules/pnpm /opt/pnpm \
  && cp /opt/pnpm/bin/pnpm.cjs /opt/pnpm/bin/pnpm \
  && chmod +x /opt/pnpm/bin/pnpm

FROM ghcr.io/certseeds/sshable:latest

COPY --from=node-builder /opt/node-lts /opt/node-lts
COPY --from=pnpm-builder /opt/pnpm /opt/pnpm

ENV PATH="/opt/node-lts/bin:${PATH}"
ENV PATH="/opt/pnpm/bin:${PATH}"

USER ${USERNAME}
WORKDIR /home/${USERNAME}
ENV PATH="/home/${USERNAME}/.local/share/pnpm/bin:${PATH}"

RUN mkdir -p \
  /home/${USERNAME}/.config/pnpm \
  /home/${USERNAME}/.local/share/pnpm/bin

COPY --chown=${USERNAME}: ./lang/.npmrc /home/${USERNAME}/.npmrc
COPY --chown=${USERNAME}: ./lang/pnpm.config.yaml /home/${USERNAME}/.config/pnpm/config.yaml
COPY --chown=${USERNAME}: ./lang/pnpm.config.rc /home/${USERNAME}/.config/pnpm/rc

ENTRYPOINT ["/bin/bash"]
```

NODE_VERSION, PNPM_VERSION 完全由外部注入, 中间过程只保留两个目录供产物复制, 最终的版本内部也不会有下载过程的缓存.

这个流程还带来了额外的好处, 由于构建过程中都是 root 权限执行, 结合中途的 `--no-same-owner --no-same-permissions`选项, `/opt` 下面的产物都是对于最终用户来说, 都是可读可执行不可写的, 变相的实现了 "immutable" 的环境.

PS: rootless 容器在 tar 解压时会有非常多的 WARN, 并且还会 exit -2 导致构建失败, 必须接一个 `|| true`

what's more, 这样的构建能够实现更高的并行度, 虽然这里是 `final -> pnpm -> node` 这个过程, 但是另起的其他镜像就是可以和 node 这个路径完全隔离的了, 比如 `final -> uv` && `final -> python-stand-alone`, 最终可以得到一个有向树, 可以完全让podman来自动并行执行, 效率++

## 容器内外互通的运行时

将运行环境优化好之后, 之后就是运行的流程了.

第一步, 先得把 `podman run` 优化好

启动起来的镜像最好能通过 `-v` 路径进行镜像内外的互通, 这样可以让内部产物可供外部实时观察进度, 也能让外部 review 实时反馈到内部.

但是也不能完全互通, `node_moduels` 以及 `target`, `cmake-build-*` 等环境或者是平台相关, 或者是内部对路径敏感, 内部外部一互通搞得都乱了.

并且权限是个问题, 映射进去的如果是 root 权限就能阻断工作流, 映射出来的是 root 就更别提了.

还要考虑容器内的 hosts 问题, 一定要把 anthropic 嵌入在二进制文件里面的 url 给阻断掉, 防止无形的大手收集数据, 甚至下发恶意指令.

in conclusion, 需要仓库级别的, 这样的脚本

``` bash
podman run \
    --userns=keep-id:uid=1001  \
    -dit \
    --name "${RUNTIME_NAME}" \
    -v "${dotfiles}"/lang/hosts.conf:/etc/hosts \
    -v $(pwd):/home/${USERNAME}/repo/awesome-exams-page \
    -v awesome-exams-node-modules:/home/${USERNAME}/repo/awesome-exams-page/node_modules \
    -v awesome-exams-vitepress:/home/${USERNAME}/repo/awesome-exams-page/.vitepress \
    -v awesome-exams-claude:/home/${USERNAME}/.claude/ \
    "${SOURCE}/${GH_USERNAME}/${IMAGE_NAME}:latest"
```

通过 `-v` 挂载本地目录, 再通过挂载具名卷 `遮蔽` 内部-外部对特殊目录的挂载, 随后使用 `--uiserns`来确保映射进去的权限没问题, 最后直接把 hosts.conf 映射到容器内强行阻断 dns 解析.

第二步, 得把 install 简化了, 不能再手动 install global claude code了

于是将 `pnpm add -D @anthropic-ai/claude-code` 把它设置成 devDendencies, 顺便 `allowBuilds` 内部允许它走 postinstall, 把binary下载进来. 这样一次 install 就能下载所有依赖

第三步, 简化 claude code 运行时配置

首先把仓库里面的 mcp 配置添加到 .mcp.json 里面让 cc 识别, 能够自动加载; 其次, 把 uv 启动 mcp 的流程都打包加到 pnpm 的指令中, 确保 `pnpm jupyter:mcp` 这种指令能够一键打开mcp

然后在 podman run 之后运行 podman cp, 把 cc 的 settings.json 原样复制到容器内部.

## 结语

最初只是为了安全构建单独的开发容器, 之后为了"高效"的构建进行优化之后, 发现仓库积累的各类配置文件可以在并行构建的阶段派上用场, 最后实现了一个可以横向扩展的开发镜像.

每一个仓库配置单独的启动脚本之后, 从 start image 到 启动cc 只需要一步.
