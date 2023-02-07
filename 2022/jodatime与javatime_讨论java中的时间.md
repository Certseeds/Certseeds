---
author: "Certseeds"
date: "2022-05-16"
title: "jodatime与javatime_讨论java中的时间"
description: "from jodatime&javatime talking about time in java"
tags: ["java", "experience"]
---

# jodatime与javatime_讨论java中的时间

joda-time成名已久,很多项目中都能见到对于他的依赖,本文立足于使用Java8中的java.time对joda-time的替换,来讨论时间这一概念以及其在系统中的组成.

## 毫秒->年,月,日,时,分,秒,etc... 序列化

在实际生产环境中,一般情况下如果使用毫秒来在API中传递时间的话,一般只传递毫秒本身,依赖双方的约定来协商毫秒所在的时区. 前端采集到事件后取得一个UTC+8条件下的毫秒,回传给后端,后端使用UTC+8解析,打印成日志,存到库内,解析成字符串再回传回去. etc...

``` java
final String normalFormat = "yyyy-MM-dd HH:mm:ss";
log.info(java.time.ZonedDateTime.
                from(Instant.ofEpochMilli(mills).atOffset(ZoneOffset.ofHours(8)))
                .format(DateTimeFormatter.ofPattern(normalFormat))
);
Assertions.assertEquals(
        java.time.ZonedDateTime
                .from(Instant.ofEpochMilli(mills).atOffset(ZoneOffset.ofHours(8)))
                .format(DateTimeFormatter.ofPattern(normalFormat)),
        org.joda.time.format.DateTimeFormat.forPattern(normalFormat)
                .print(new org.joda.time.DateTime(mills)
                        .withZone(DateTimeZone.forOffsetHours(8))
                )
);
```

输出

``` log
信息: 2022-02-22 22:22:22
```

这里可见,java.time此处更"函数式"一点,整个流程都没出现new,并且是由要时间调用formatter格式化自己,而非formatter去格式化时间,整体流程toString(),用起来更舒服.

PS: 并且DateTimeFormatter有些内置的staticPattern,还示范了Builder的用法和嵌套,挺有用的.

## 毫秒->某个时区的某天的某个时刻,再转换到该天某时刻

这个需求常见于扫描,默认值等,比如如果不填时间参数,默认事件为前天3:00-昨天3:00.

这里一般情况下也默认毫秒不带时区,使用双方约定好的时区.

``` java
final long mills = System.currentTimeMillis();
final long javaTimeThree = java.time.LocalDate.from(Instant.ofEpochMilli(mills).atOffset(ZoneOffset.ofHours(8)))
                .atStartOfDay()
                .minusDays(2)
                .plusHours(3)
                .toInstant(ZoneOffset.ofHours(8))
                .toEpochMilli();
log.info(String.valueOf(javaTimeThree));
Assertions.assertEquals(
        javaTimeThree,
        new org.joda.time.DateTime(mills).withZone(org.joda.time.DateTimeZone.forOffsetHours(8))
                .withTimeAtStartOfDay()
                .minusDays(2)
                .plusHours(3)
                .toInstant().getMillis()
        );
```

这里可见java.time更明确一点,从毫秒转化成Instant需要指明时区,转换成LocalDate之后再转换回Instant还是需要指明时区,很精确.

### 字符串解析为毫秒: 反序列化

虽然约定使用某个时区的毫秒能节省大量讨论时间,但是事实上很多地方积重难改,传参硬性要求为字符串,或者返回值是字符串,此时有必要将字符串转化成毫秒存储起来.

``` java
final String timeFormat = "yyyy-MM-dd HH:mm:ss";
final java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern(timeFormat);
final long java8UTC0 = java.time.LocalDateTime.parse("2022-02-22 22:22:22", dtf)
        .atOffset(ZoneOffset.ofHours(0))
        .toInstant()
        .toEpochMilli();
final long java8UTC8 = java.time.LocalDateTime.parse("2022-02-22 22:22:22", dtf)
        .atOffset(ZoneOffset.ofHours(8))
        .toInstant()
        .toEpochMilli();
log.info(String.valueOf(java8UTC0));
log.info(String.valueOf(java8UTC8));
Assertions.assertEquals(
        java8UTC8 ,
        org.joda.time.LocalDateTime.parse(
                        "2022-02-22 22:22:22",
                        org.joda.time.format.DateTimeFormat.forPattern(timeFormat)
                ).toDateTime()
                .withZone(DateTimeZone.forOffsetHours(8))
                .toInstant()
                .getMillis()
);
Assertions.assertNotEquals(
        java8UTC0,
        org.joda.time.LocalDateTime.parse(
                        "2022-02-22 22:22:22",
                        org.joda.time.format.DateTimeFormat.forPattern(timeFormat)
                )
                .toDateTime(DateTimeZone.forOffsetHours(0))
                // .withZone(DateTimeZone.forOffsetHours(0))
                .toInstant()
                .getMillis()
);
```

这里能看出java-time和joda-time看起来的调用方式很类似,但是joda-time有点怪,withZone没效果,toInstant出来的毫秒没变,toDateTime才有效.

## last

java-time作为joda-time的演进产物,能感觉到更严格了些,处理二义性更少些, 如果能够适当的选择部分特性进行开发的话,使用JDK内置的java-time即可取代joda-time.

当然,虽然这么讲,但是处理外部遗留接口时仍然需要对诸如`Asia/Shanghai`这样的字段进行处理,这个时候java-time将其分割开,将简单的+8时区和上述字符串分离,相对来讲复杂度更低了,出bug几率会更少; 算是有利有弊.