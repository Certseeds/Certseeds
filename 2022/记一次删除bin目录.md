---
author: "Certseeds"
date: "2022-05-14"
title: "记一次删除bin目录"
description: "action log for rm -rf /bin"
tags: ["experience", "dangerous"]
---

# 记一次删除`/bin`

## 删除`/bin`

测试机上的debian比较老,拉去不下来支持DOCKER_BULITKIT的docker,决定拉取docker打包好的二进制文件下来.root账户下, wget下来压缩包,解压,建了个./binary文件夹存二进制,再把二进制文件挪到`/usr/docker/`下面.

`/usr/docker/`下面的结构大概是

``` tree
.
..
docker-20.10.9
docker-20.10.9.tar.gz
docker-latest -> /usr/docker/docker-20.10.9
```

把docker-latest下面的二进制软链到/usr/bin/${BINARY_NAME}, `sudo dockerd &`启动dokcer.

然后回到下载的临时目录,准备吧`./binary`删掉, 熟练的输入`rm -rf /bin` 敲击Tab补全,Enter执行

执行速度非常快,快到没来及的按`Ctrl+C`,ls指令已经挂掉了.

## 开始恢复

意识到删掉了`/bin`,猛地吓了一跳,赶紧开始测试受了什么影响.

+ ls挂了
+ cp挂了
+ mv挂了
+ bash都挂了

目前处于一个无法ls,无法cp,无法mv,都甚至没办法开一个新bash的状态,也就意味着没有新的ssh能连进来,这个ssh挂掉之后恐怕就只能重装了.

### 回收垃圾

第一反应是找是否能回收垃圾,但是`rm -rf`删除的完全无法直接通过命令来恢复,GG.

### 分析损失

随后,开始通过另外一台机器来执行命令对比排查到底都删除了什么

``` bash
$ ls /bin
bash                cp             kbd_mode    netcat         readlink                  systemd-tty-ask-password-agent
btrfs               cpio           kill        netstat        red                       tar
btrfs-debug-tree    dash           kmod        networkctl     rm                        tempfile
btrfs-find-root     date           less        nisdomainname  rmdir                     touch
btrfs-image         dd             lessecho    ntfs-3g        rnano                     true
btrfs-map-logical   df             lessfile    ntfs-3g.probe  run-parts                 udevadm
btrfs-select-super  dir            lesskey     ntfscat        rzsh                      ulockmgr_server
btrfs-zero-log      dmesg          lesspipe    ntfscluster    sed                       umount
btrfsck             dnsdomainname  ln          ntfscmp        setfacl                   uname
btrfstune           domainname     loadkeys    ntfsfallocate  setfont                   uncompress
bunzip2             dumpkeys       login       ntfsfix        setupcon                  unicode_start
busybox             echo           loginctl    ntfsinfo       sh                        vdir
bzcat               ed             lowntfs-3g  ntfsls         sh.distrib                wdctl
bzcmp               egrep          ls          ntfsmove       sleep                     which
bzdiff              false          lsblk       ntfsrecover    ss                        whiptail
bzegrep             fgconsole      lsmod       ntfssecaudit   static-sh                 wslpath
bzexe               fgrep          mkdir       ntfstruncate   stty                      ypdomainname
bzfgrep             findmnt        mkfs.btrfs  ntfsusermap    su                        zcat
bzgrep              fsck.btrfs     mknod       ntfswipe       sync                      zcmp
bzip2               fuser          mktemp      open           systemctl                 zdiff
bzip2recover        fusermount     more        openvt         systemd                   zegrep
bzless              getfacl        mount       pidof          systemd-ask-password      zfgrep
bzmore              grep           mountpoint  ping           systemd-escape            zforce
cat                 gunzip         mt          ping4          systemd-hwdb              zgrep
chacl               gzexe          mt-gnu      ping6          systemd-inhibit           zless
chgrp               gzip           mv          plymouth       systemd-machine-id-setup  zmore
chmod               hostname       nano        ps             systemd-notify            znew
chown               ip             nc          pwd            systemd-sysusers          zsh
chvt                journalctl     nc.openbsd  rbash          systemd-tmpfiles          zsh5
```

可见cat gzip tar什么的都G了,bash,dash,zsh也都GG, echo还好,还能用,但是想用它写入二进制数据到文件的话,得先把/bin创建出来,这一步需要的mkdir也被删除了.

随后,通过其他机器的对比,发现wget,curl这样的命令在`/usr/bin`中,没有被波及到, 可以用他们来下载必要的二进制数据: 这个效率可比echo高多了

要通过wget下载的话, 最优选就是busybox(/bin/busybox已经被波及到了,已经消失了),wget了二进制到本地之后,发现了一个问题,busybox没法执行?!

原来是因为busybox只有0400的权限,只读,无法执行. 而chmod +x ./busybox所需的的chmod已经随着`/bin`一起消失了...

### docker起奇效

这时候回想起来刚才的操作,突然意识到,之前使用root权限启动了docker,docker可以映射文件夹,岂不是可以把/bin映射到镜像内,再从镜像内把文件复制过去?!

``` bash
$docker run -dit /bin:/home/user/bin debian:jessie
```

之后docker exec -it ${HASH} /bin/bash 成功进入docker内部, `cp /bin/* /home/user/bin`,退出docker.

试下ls,没有报错,修复完成.

## 总结

1. 完全在root权限下执行命令很危险, 完全在root权限下单凭命令行执行更危险.
  + 日常操作要切到普通用户执行
  + 日常重复操作最好写成脚本,再调用脚本,不要再命令行执行过于复杂的指令.

2. 需要给/bin目录加上锁,至少也得给/bin/busybox加锁,防止误删.

3. 虽然都说静态链接浪费空间,但是出事时静态链接的软件对其他二进制完全不依赖,确实可以规避风险.