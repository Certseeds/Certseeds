---
author: "Certseeds"
date: "2023-03-15"
title: "前端工具链之git hook and changelog"
description: "frontend toolchain: husky and changelog"
tags: ["frontend","experience","open-source"]
---

# 前端工具链之git hook and changelog

近期在入门前端工程化, 初步把单页应用打起来之后, 准备学习一下前端工具链里面便利的工具.

## 是什么

+ git hooks
+ changelog

## 为什么要存在

### githooks

githooks会在git的不同阶段挂上钩子, 触发操作, 方便开发执行脚本. 客户端最常见的是`pre-commit`以及`commit-msg`, 分别会在`git commits`操作完成后, 以及`commit-msg`写完之后触发.

比如很常见的场景: 为了保证起码的代码质量, 至少本地得编译通过才能提交, 就可以用`pre-commit`钩子.

### changelog

changelog主要用来总结git提交, 即使完全遵守one commit do one thing, 遵守commit-msg的规范, 当软件推出几十个版本的时候,在git commit里面查feature引入令人痛苦, 所以需要在commit-msg的基础上, 提取出一个Markdown文件来专门记录.

## 前端的解决方案

### githooks

问题来了, githooks本身是bash脚本, 需要把它们'注册'进 `.git`目录里面, 但是`.git`是元数据的目录, git不会读里面的文件. 导致它自己反而进不了git.

为了解决这个问题, gerrit给出了一种解决方案: 把clonerepo动作和clone ssh链接器来, 反正CHANGE-ID生成逻辑就在脚本里面, `git clone ${url} && curl -Lo ${url} ./.git/commit-msg`
但是文件一多, 就会变得很麻烦, 更别提变更怎么办了.

前端社区给出另一种解决方案`husky`: 另找一个地方存脚本, 之后找一个包去复制脚本/关联位置(并且把运行它加入到`npm prepare`里面), 这样维护起来方便, 有可选性.

### changelog

手动维护在这个场景下不算解决方案, 太依托人的可靠度了, 亲眼见到有前辈之前维护的CHANGELOG后期不再维护, 逐渐废弃.

前端给出了两个解决方案: `changeset` && `changelog`

changeset使用和husky类似, 找一个位置自定义每次的额外信息, publish的时候统一融合到一起形成markdown文件; 但是仔细思考会发现一个不恰当的地方: 为什么要舍近求远, 把一件事在changeset-doc和commit-msg里面写两次呢?

changelog更简单直接: 按一定格式, 从commit-msg里面提取关键信息到README里面, 默认不进行任何设置, 则只提取第一行.

由于changelog依托commit-msg的格式, 趁机介绍一下 `commit.template`, 配置在文件里面之后, 写commit-msg时会自动读取路径上的文件, 当作模板.

当然,前端也有对应的解决方案`Commitizen`, 可以命令行交互式写commit-msg, 本文不再赘述.

## 后端有对应解决方案吗?

### git hooks

``` xml
<plugin>
    <groupId>com.rudikershaw.gitbuildhook</groupId>
    <artifactId>git-build-hook-maven-plugin</artifactId>
    <version>3.2.0</version>
    <configuration>
        <gitConfig>
            <!-- The location of the directory you are using to store the Git hooks in your project. -->
            <core.hooksPath>build_tools/hooks/</core.hooksPath>
            <!-- Some other project specific git config that you want to set. -->
            <custom.configuration>true</custom.configuration>
        </gitConfig>
        <installHooks>
            <!-- The location of a git hook to install into the default hooks directory. -->
            <pre-commit>build_tools/hooks/pre-commit</pre-commit>
        </installHooks>
    </configuration>
    <executions>
        <execution>
            <goals>
                <!-- Sets git config specified under configuration > gitConfig. -->
                <goal>configure</goal>
                <goal>initialize</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

maven也不是没有git hooks插件,比如上面这个; 但是侵入式都比较强, 配置多, 麻烦, 并且会和主流程耦合到一起, 反而不如引入前端的husky, 起码不会对不会用的人造成困扰, 可以渐进式的引入.

### changelog

同理, 并不是没有, 而是不够好用, 更新慢, bug多.
