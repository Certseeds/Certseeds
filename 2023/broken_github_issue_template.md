---
author: "Certseeds"
date: "2023-07-07"
title: "broken github issue template"
description: "即使是github也无法保证文档和实现相对应"
tags: ["experience", "github"]
---

# broken github issue template

有些人可能会认为像GitHub这种行业头部的平台, 在每个方面就能做到尽善尽美, 但是事实是否定的.

## what is issue_template

issue_tempalte是什么呢? 参考 <https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates>, 是提单的模板, 并且能在newIssue的时候作为候选项, 和什么模板都没有一起, 作为"choose"的备选项.

通常情况下, 这可以减少一部分必要的工作量, 如果issue来源可以标注这个issue是否来自模板的话就更好了, 让reviewer给问题打标签的时候更方便, 让提单人少敲点字, 多思考自己准备是否充分.

而且经过yaml格式的强化之后, 还可以变成(伪)交互式的, 类似调查问卷的模板.

## how .github works

.github是什么? 首先, .github是issue_template应该在的地方, 仓库`.github/ISSUE_TEMPLATE/`下面的md或者yaml会被读取, 作为模板在新建issue时被选中.

`.github/`自己下面还包括其他的文件, 具体参考 <https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file>,

可以看到, 里面有各种各样*字***体**的文件, 斜体,正常, 双反引号, etc... 各自起到一部分作用(不包括LICENSE, 它需要在每个仓库里面默认配置)

`.github`还可以是仓库名, 会作为各种文件的fallback选择, 如果找不到`https://github.com/${username}/${repoName}/blob/release/${file}.md`,就去找`https://github.com/${username}/.github/blob/release/${file}.md`.

## broken issue_template

问题是什么? 问题在于`.github`仓库里, fallback文件中, COC,Contributing, Security-Policy能起作用,甚至pull-request-template起作用, 但是ISSUE_Template不起作用.

即使满足<https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/about-community-profiles-for-public-repositories>的条件, issue_template还是那样, 最搞笑的是它甚至不在自己的仓库起作用...

在`.github`仓库的ISSUE_TEMPLATE文件夹下, 无论是markdown还是yaml, 都没有办法让甚至`.github`仓库自己的issue_template起作用.

只有两个解释:

1. 文档有错, issue_template和LICENSE一样, 只能一个一个配置.
2. issue_template的fallback broken down了

考虑到checklist上IssueTemplate甚至是灰色的, 都没指向任何一个文件夹, 很可能是第一种可能.
