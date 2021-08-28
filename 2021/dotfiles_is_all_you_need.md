<!--
 * @Github: https://github.com/Certseeds/words
 * @Organization: SUSTech
 * @Author: nanoseeds
 * @Date: 2021-07-25 18:21:01
 * @LastEditors: nanoseeds
 * @LastEditTime: 2021-08-13 00:30:00
 * @License: CC-BY-NC-SA_V4_0 or any later version
 -->

<!-- 软件开源 ->
 家庭环境非常自由 ->
 商用环境非常不自由 ->
 如何规避?使用Linux! ->
 Why? 开源及开源许可证! ->
 为了使用开源要使用wsl ->
 要使用wsl,管理服务器, 要使用dotfiles ->
 dotfiles使用心得
 dotfiles拓展到windows端
 在windows上使用包管理
 -->

# Dotfiles is all you need

当我们在家使用个人电脑时,我们是非常自由的,通常情况下,个人电脑系统-无论是Windows,Linux又或是MacOS,只要具有系统密码,我们可以做几乎任何事.从架设虚拟机,虚拟机内做好备份后,每30天重置一次,无穷尽的利用软件试用期;到利用密钥,破解假设虚拟机的VmWarePro本身;甚至是利用10块一把的windows-Pro密钥对Windows进行激活;搭建KMS服务器激活Office;又或是从各个平台捞取靠谱或者不靠谱的破解秘籍,攻略,教程,密钥,补丁;用学生邮箱获取GitHub pro,Jetbrains全家桶;使用社区版Visual Studio,体验使用世界第一IDE进行开发的体验;任意获取各种免费或者不免费的字体,体验不同风格的文字.在个人电脑上自由几乎是无限的,同时几乎不需要考虑被追踪到,被发律师函,要求对所有行为进行补偿的风险.

但是在商用环境,一切都不同了.不同于难以追踪的个人,公司很容易被追踪,同时也被各个厂商紧盯着,从Windows系统(PS:这也是MacBook优点之一,设备自带无限制MacOS使用授权),Office(个人版不可用于商用),各种软件到Visual Studio专业版(社区版MSVC编译产物不可用于商用),Jetbrains全家桶(pro版需付费,破解版显然只会引来律师函),到宣传资料上的字体(典型例子:微软雅黑,版权归于方正,不可用于商用),甚至一些Web服务也只供个人使用,商用需要进行付费;由此可见,各个角度,各种限制,想要进行规避要费尽心思.

如何规避这种场景呢?有些时候,我们可以使用一些不会产生问题的产品,Office可以被LibreOffice所取代,Jetbrains提供了不限制使用的Idea社区版;但是归根结底,这些软件几乎都是开源软件,它们使用开源许可证对风险进行规避.LibreOffice使用MPL和LGPL;IntelliJ IDEA Community Edition使用Apache-2.0许可证发布;GCC和Clang-LLVM不对编译产物有任何限制;vscode基于MIT;SorceCodePro,Source-Han-Sans基于OFL-1.1 License;这些许可证明确了用户的权限的局限性,在单纯的使用而非分发情况下,几乎具有"可控的无限自由",可用于商业用途,甚至可以对其代码进行修改后,开发内部闭源版本(仍然不涉及对外分发).

或许更重要的是,在沟通中,获得了这么一条信息,大多数情况下,MacOS和Windows都被认为是桌面端系统,会涉及到上述所有的律师函警告;但是Linux端多数时间被认为是服务器端系统,通常情况下只有系统本身(比如使用了RedHat某些需要付费的系统)会涉及律师函,通过apt源,代码编译等途径获取到的包通常风险都被许可证所隔离.总之,使用Linux来工作可以规避风险.

最初的想法当然是使用虚拟机,无论是哪个平台都有可商用的VirtualBox,Ubuntu等系统镜像也可用于商用,这样,两者一结合,就可以在其他平台上使用Linux,更进一步讲,就可以在其他平台使用linux生态.

再进一步讲,还有什么方式?还可以利用Inter-NUC等小型设备,在其上部署好Ubuntu系统后,使用IDE的remote功能开发.弊端在于价格很高,性能好-价格便宜-体积小基本上属于不可能三角,性能好+价格便宜=>捡垃圾=>大机箱,价格便宜+体积小=>树莓派=>性能差,性能好+体积小=>inter-nuc=>很贵.

再进一步,还有什么方式?可以使用windows-subsystem-linux,微软实现了一套Posix接口的NT内核实现,从而实现了linux子系统(当然,这只是WSL1的原理,并且有些API实现不足,导致某些涉及内核的操作有问题),可以方便的使用一套硬件同时运行Windows程序与Linux平台程序.

当然了,这都是个人的解决方法,最好的方式还是拥有个人的云主机(据不可靠消息,腾讯的云开发机平均8C-Xeon+16G内存+500G-SSD),但是,无论是Linux虚拟机,Linux小型实体机,Windows-subsystem-linux还是云开发机,它们都是Linux系统,在Linux系统下开发就要按照Linux的规则来进行.

由于Linux系统下没有统一的注册表,一般情况下,各种包使用一个文件来记录配置,git的配置在`~/.gitconfig`,ssh配置文件在`~/.ssh/config`,conda配置文件在`~/.condarc`,vim配置文件在`~/.vimrc`,docker配置文件在`"/etc/docker/daemon.json"`,cargo配置文件为`~/.cargo/config`,zsh配置于`~/.zshrc`,而oh-my-zsh更在`~`下有一个配置文件夹`~/.oh-my-zsh`......等等,不一而足.可以看到,这些文件散落的混乱不堪,几乎没有什么规则:某些文件在`~`;某些文件在系统文件夹下,没有用户配置;`.zshrc`还会include进各种shell脚本.

如何对这些配置文件进行管理呢?手动对这些文件管理的话很繁琐,很容易出现某个配置被漏掉,用到的时候才发现,到时候手忙脚乱,消耗很多时间;使用其他云端机器的时候,需要从零开始配置来方便开发,更是很难从自己本地配置中归纳出本地的修改,将其同步到云端.如何解决这个问题?

一个解决方案是`dotfiles`,体现为`~/dotfiles`文件夹.对于各种几乎不变的配置,比如`.condarc`,`~/.cargo/config`,将其保存在dotfiles的对应文件夹中,软链接到对应位置;对于比如`~/.gitconfig`这一类各个平台不一致但是有很多共同之处的文件(因为需要配置gpg-key),将其保存为template,使用.gitignore将其忽略,在本地修改gitignore将对应文件纳入到版本管理中. 对于整个文件夹,在github上建立master分支,在本地将配置文件纳入到版本管理,并切换到local分支(当然,由于涉及到一些私密文件,绝对不将其推送出去).

我们以文件夹结构来分析,

### subfolder: git

``` tree
├── .gitattributes
├── .gitignore
├── README.md
├── git
│   ├── .gitconfig
│   ├── .gitignore
│   ├── .ssh.config
│   ├── gitcommit
│   ├── gitconfig.template
│   ├── linux.sh
│   ├── ssh.config.template
│   └── windows.ps1
```

git子文件夹,主要保存git与ssh相关文件,.gitconfig,.ssh.config为template产生,gitcommit被用于产生git commit Message(通常情况下,这种模板有助于有意义的git commit message)

``` git

</subject>

Branch:

<type>:
- [ ] Bug fix
- [ ] Bug fix (Test)
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] This change requires a documentation update

<body>

<footer>
```

### subfolder: key

``` tree
├── key
│   ├── .gitignore
│   ├── README.md
│   ├── one.pri.key
│   ├── one.pri.key.pub
│   ├── two.pri.key
│   └── two.pri.key.pub
```

保存一些密钥,比如ssh公钥&私钥,gpg公钥&私钥,同时在README.md中记录其缩写(通常情况下在网页上填写后,会反馈的一串'指纹',便于网页端和本地一一对应)

### subfolder: lang

``` tree
├── lang
│   ├── .condarc
│   ├── .gitignore
│   ├── .vimrc
│   ├── cargo.config.toml
│   ├── daemon.json
│   ├── init.gradle
│   ├── linux.sh
│   ├── pip.conf
│   ├── settings.xml
│   ├── vimrc.template
│   └── windows.ps1
```

主要保存有各种开发用配置文件,比如`vimrc`以及pip的配置文件`pip.conf`

### subfolder: ubuntu

``` tree
├── ubuntu
│   ├── linux.sh
│   ├── proxychains4.conf
│   ├── proxychains4.info.conf
│   ├── sources
│   │   ├── linux.sh
│   │   ├── sources_163_1804.list.backup
│   │   ├── sources_aliyun_1804.list.backup
│   │   ├── sources_aliyun_2004.list.backup
│   │   ├── sources_tsinghua_2004.list.backup
│   │   ├── sources_ustc_2004.list.backup
│   │   └── sources_ustc_kail_sana.list.backup
│   ├── ssh.config
│   ├── sshd_config.conf
│   └── sshd_config.info.conf
```

保存有apt的换源所需文件,ssh(openssh-client)配置文件,sshd(openssh-server)配置文件.

### subfolder: wsl

``` tree
├── wsl
│   ├── init.wsl
│   ├── linux.sh
│   ├── set_proxy.sh
│   └── wsl.conf
```

主要保存wsl端的`init.wsl`-自启动配置以及`wsl.conf`-文件系统相关配置.

### subfolder: zsh

``` tree
└── zsh
│   ├── .LD_LIBRARY_PATH.sh
│   ├── .conda.sh -> ~/dotfiles/zsh/anaconda3.sh
│   ├── .gitignore
│   ├── .texlive.sh
│   ├── .zshrc
│   ├── LD_LIBRARY_PATH.template.sh
│   ├── anaconda3.sh
│   ├── linux.sh
│   ├── miniconda3.sh
│   ├── texlive.template.sh
│   └── zshrc.template.sh
```

主要保存终端相关配置,以zshrc为主,选择性引入其他shell文件.

### subfolder: powsh and script

``` tree
├── powsh
│   ├── .gitattributes
│   ├── .poshtheme.json
│   ├── profile.ps1
│   └── windows.ps1
└─── script
    ├── linux.sh
    └── windows.ps1
```

主要保存windows端相关配置以及启动脚本

## dotfiles使用心得

将这些文件纳入到dotfiles之后,切换主机就变成了一项较为简易的事情,拉取dotfiles库,复制相关文件,建立软连接,将key纳入本地版本管理.而本地的dotfiles位于local分支,如果有修改,想要推送到主分支该如何是好?

答案是使用另一个独立的`~/dotfiles-master`来准备`Pull-Request`,远端合并后,`~/dotfiles`用`pull`将其合并.

##### Windows & Dotfiles

上面的子文件夹中,`linux.sh`与`windows.ps1`出现频率几乎相同,很显然,这些开发配置也可以用于Windows端,更进一步讲,Windows端也可以用命令行进行软件管理,但是这和本文主题无关,不再提及.

#### 回到主题

回到主题,dotfiles可以方便的辅助配置主机环境,在Linux端有相当多的软件可供利用,从GCC,Clang-LLVM等编译器,到MdBook(based on rust),pdftoText(based on nodejs)等软件包,到思源宋体(SourceHanSerif),思源黑体(SourceHanSans),SourceCodePro等开源免费字体(OTL许可证,可免费商用,甚至嵌入到宣传资料中而不需要标明,当然,嵌入到软件中作为默认字体还是要标明使用并携带协议的,但是没传染性),wget,curl,aria2c,proxychains4等等几乎无穷尽,并且没有风险的软件包.

最后,本文从家用环境和商用环境的不同作为引子,指出了Linux端进行开发的必要性与优越性,列举了几种可能的Linux端使用方案,介绍了便利Linux端配置的解决方案-Dotfiles,根据Dotfiles的文件夹结构对其进行了介绍,并将相关文件分为两类,采用不同的方案进行管理,最后指出:最终的目的是使用Linux端生态,摆脱时刻要考虑风险的窘境.

注: 发布于GitHub的本文采取CC-BY-NC-SA-4.0 or any later version,保留在其他平台采取不同许可证的权利-转发链路不同导致的许可证不同问题,请通过到源发布平台转发来解决.