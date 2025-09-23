---
author: "Certseeds"
date: "2025-09-23"
lastmod: "2025-09-23"
title: "总结如何链接到gemini-cli上"
description: "google-gemini/gemini-cli登陆的第一种-也是额度最大的一种-登陆方式"
tags: ["notes", "experience", "google"]
---

# 开始使用 google gemini-cli

## 下载安装

``` bash
pnpm install -g @google/gemini-cli
```

> 注意, Windows 上安装的 pnpm, 在 WSL2 中会优先加载, 可能会出现卡住等现象, 建议 `which pnpm` 观察到底启动的是哪一个gemini

由于 zh-CN 以及 zh-HK 均不在 <https://developers.google.com/gemini-code-assist/resources/available-locations> 中列出的 提供服务的国家与地区名单 中, 需要在安装前执行几步操作, 若网络条件不允许, 还得额外执行一些操作.

## web端

### step1

参考 <https://cloud.google.com/gemini/docs/discover/set-up-gemini#enable-api>

打开 <https://console.cloud.google.com/marketplace/product/google/cloudaicompanion.googleapis.com?hl=zh-cn>

并启用 `Gemini for google cloud`

### step2

参考 <https://cloud.google.com/gemini/docs/discover/set-up-gemini#enable-api>

打开 <https://console.cloud.google.com/projectselector/iam-admin/iam>

选中项目(一般是 `My First Project`)内的修改主账号功能(对应icon 是个铅笔)

1. 添加其他角色, 输入 `Gemini for Google Cloud User`, 选中对应的并添加
2. 添加其他角色, 输入 `Service Usage Consumer`, 选中对应的并添加

保存, 到这一步结束.

### step3

接下来打开 <https://console.cloud.google.com/projectselector/iam-admin/iam>, 点击页面最上方, `Google Cloud` 标志右面的 `My First Project`

在弹出的 `选择项目` 页面中选中对应的ID即可, 一般格式为一个24位的字符串

### 命令行设置

``` bash
$ echo 'in unix-like'
$ vim ~/.zshrc
export GOOGLE_CLOUD_PROJECT="AABBCCDDEEFFGGHHIIJJKK"
export GOOGLE_CLOUD_LOCATION="global"
$ source ~/.zshrc
```

在 windows 上, 或者是选择直接向环境变量内添加变量, 或者是编辑 `profile.ps1` 这种powershell初始化时会加载的文件.

注意, 这种文件有复数个, 如下

``` powershell
"${PSHOME}\profile.ps1"
$userPath = "C:\Users\${env:USERNAME}"
"$userPath\Documents\WindowsPowerShell\Microsoft.Powershell_profile.ps1"
"$userPath\Documents\WindowsPowerShell\Profile.ps1"
"$userPath\Documents\PowerShell\Microsoft.Powershell_profile.ps1"
"$userPath\Documents\PowerShell\Profile.ps1"
```

一般选择`"$userPath\Documents\WindowsPowerShell"`下面的那两个进行编辑

``` powershell
set $Env:GOOGLE_CLOUD_PROJECT="AABBCCDDEEFFGGHHIIJJKK"
set $Env:GOOGLE_CLOUD_LOCATION="global"
```

### 网络问题

有些情况下, 本地的 gemini 打开的登陆网页, 无法连接本地 gemini 的 localhost, 这种情况下可以配置

``` bash
export NO_BROWSER=true
```

```pwsh
set $Env:NO_BROWSER="true"
```

如果在命令行上输入网页提供的登录码依然无法登录, 可以尝试在一个更好的网络环境下登录, 或者尝试一下 `opencode auth login via Github Copilot`
