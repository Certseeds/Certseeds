---
author: "Certseeds"
license: "CC-BY-NC-SA-4.0 or any later version"
date: "2021-09-12"
title: "漫谈Database-项目中实际遇到的Mysql问题及其解决"
description: "something about db"
tags: ["experience", "database"]
---

# 漫谈Database-项目中实际遇到的Mysql问题及其解决

最近涉及到后端相关的工作,涉及到不少数据库相关的事情. 整理一下避免忘记.

## 选择数据库

说是选择数据库,其实就两个可选项-PosgreSQL,Mysql

Posgresql: 最先进的开源数据库

Mysql: 最热门的开源数据库

更多情况下选择Mysql而非PostgreSql的结果就因为其热门,并且有依存于Mysql的生态(比如大数据的hadoop,各种依托Mysql搭建的分布式数据库).

如果是个人项目,那么选择的肯定是PostgreSQL,功能强大方便开发. 但是一旦变成小组开发,需要团队协作,需要使用团队的公有技术栈,自然选择Mysql.

### 选择MySQL版本

更现代的开发方式会让专业的工具进行专业的工作,数据库设计到数据库结果生成的这个步骤就有不少专业工具可以做, MySQL下最直接的当属 MySQL workbench,(虽然是英文界面)简单方面,涉及各个方面,可以一键导出SQL语句,支持导出导入备份. 这个软件导出的SQL语句版本为8.0,这里就产生了问题,要不要跟随MySQL workbench的SQL语句一起选择MySQL8.0呢?

对于小团队来说,高度依赖本地测试环境,本地测试环境和线上环境比起来,令线上环境与本地测试环境同步显得更简单,而Windows端使用scoop下载到的版本有且只有MySQL 8.0,因此-最终决定使用Mysql8.0

对于更大的团队,测试有CI系统在专有环境下运行来保证,本地测试环境与线上环境相比,改变本地测试环境更简单,在这种环境下,所有问题的依赖都可以归结于-线上用什么版本,本地就用什么版本,新项目就用线上能使用的最广泛,最简单,最合适的版本,之后再同步回本地测试环境.

PS: Ubuntu 18.04.5默认使用MySQL 5.7,因此若要安装MySQL8,请

``` shell
    wget https://repo.mysql.com//mysql-apt-config_0.8.19-1_all.deb
    sudo dpkg -i mysql-apt-config_0.*.****_all.deb # config source
    sudo apt remove mysql-server # remove mysql-5.7
    sudo apt update
    sudo apt install mysql-server # install mysql-8.0
    mysql --version
```

### 选择数据库连接层

很多情况下这一点会被忽略掉,SpringBoot有默认配置的数据库连接池-Hikari,选择的标准是性能(毕竟数据库池默认状态下也只作为中间件,不出风头).我们可以处于其他目的做出更多选择,典型情况下,小团队中对数据库的分析也就限于如果出现线上超时,就根据日志对其进行分析的层次,这种情况下数据库连接池其实作为一个中间代理,可以有更多的作为-比如分析SQL执行情况. Alibaba的Druid连接池在这一点上做的就很到位,默认提供了一个监控端口,可以图形化的查看SQL执行情况,还有汇总统计数据,可以按此分析.

替换数据库连接池在SpringBoot中只需要添加依赖,然后修改配置文件,重新启动后就会自动使用配置好的数据库连接池.

另外数据库连接池值得注意的是,连接不是越多越好的,并不是搞个1000连接数就能支持1000并发,这样只会令池子里充满了动不了的连接;理想状态下使用$(nproc)+1的数据库连接数就够了,这样能让数据库连接池中的连接快速流动起来,快速的完成连接,并接入下一个连接,快速的循环.

#### 数据库连接池的兼容性问题

Hikari被选为默认连接池,不仅因为性能好,还因为兼容性强,比如很火的H2内存数据库就有很好的支持,而Durid就支持的不好.但是大多数情况下仅有MySQL,PostgreSQL这两个可选项下,其实兼容性体现不出明显区别.

### 选择数据库ORM层

此处完全看项目需求,如果对SQL只有增删改查,那么不妨使用JPA接口,底层用Hibernate;如果涉及大量复杂自定义操作,可能使用MyBatis更加适合;小团队进行不太复杂的操作-可以考虑使用MyBatis-Plus.

### 注意事项

#### 时区

为了保证一致性,项目中的时间戳永远由后端生成,因此数据库连接上应该有`?useUnicode=true&characterEncoding=utf8&serverTimezone=GMT%2B8`这样的后缀,来指定格式与时区.

#### 格式

为了保证存储尽量兼容所有字符集,建表建库时都应该用`DEFAULT CHARACTER SET utf8mb4 collate utf8mb4_unicode_ci;`来显式使用UTF-8

#### 让表结构和测试数据静态化

表结构和项目的结构密不可分-一般每次提交都只对自己这个提交内的表结构表示兼容,因此,需要将建表语句,测试数据都放入仓库,方便自动CI系统进行测试.

更进一步将,应该在Spring的配置文件中指定测试状态下,每次运行都重建表,重建数据,保证测试环境稳定性(这样的话,永远不要在生产环境 mvn test)