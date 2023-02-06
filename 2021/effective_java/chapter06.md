---
author: "Certseeds"
date: "2022-06-05"
title: "effective java reading notes chapter06"
description: "effective java reading notes 06"
tags: ["java","effective" ]
---
## Chapter 06 枚举,注解

### 06-34 enum取代常量

如果用在内部的话,enum不带任何参数就足够使用了,enum本身的命名就对应着意义.

但是如果是对外沟通的时候就不一样了,需要考虑如何将枚举序列化成常量,又如何将常量反序列化枚举. 将这个处理好之后,才能方便的对外进行沟通.

### 06-35 实例域取代序数

锐评: java枚举的`name()`,`ordinal()`方法都应该加上警告,他们只应该被库作者使用,不应该让开发者直接接触到.

不直观,顺序变了`ordinal()`就会变,重构重命名之后`name()`就换了,完全不利于使用.

想要用,得自己定义`private final int value;`和`@Getter`

### 06-36 EnumSet 取代位域

位域类似于下面

``` java
@Getter
@AllArgsConstructor
public enum TEXT{
    BOLD(1 << 0),
    ITALIC(1 << 1),
    UNDERLINE(1 << 2),
    STRIKETHROUGH(1 << 3),
    ;
    private final int style;
}
```

被用于接口时的调用方式类似`object.invoke(TEXT.BOLD.getStyle() | TEXT.UNDERLINE.getStyle())`

风格非常的C,缺陷也很显著:

+ 需要提前约定边界值,int只能用来标记32个
+ 很难看,一长行在`|`
+ 繁琐,需要手写`<<`算式

在纯粹对内使用的时候,不如直接用`EnumSet`来取代.

PS: 当然,jni调用c接口的时候还是得这样操作,或者,可以包装一层?