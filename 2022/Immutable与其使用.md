---
author: "Certseeds"
date: "2022-05-29"
title: "Immutable与其使用"
description: "immutable and usage"
tags: ["java", "software_engineering"]
---

# Immutable及其使用

近期在code-review时对于java中的`final for variable`有一些讨论,因此写一个短文总结下immutable思想,以及immutable在现代编程语言中的使用

## Immutable思想

Immutable:不可变的. 在编程语言中常用于形容运行时常量,与之关联的最著名的库是guava提供的Immutable-Collections,提供了比JDK内置的集合类更好用的不可变集合.

这里要先明确一个概念,对一个`List<Integer> x;`来说,`x = new LinkedList<>();`和`x.set(0,2);`是两个不同的概念,第一种被称为修改`指针的指向`,第二种被称为修改`指针指向的对象`

不可变集合类能够和Stream结合,带来很好的开发体验. 通过禁用修改指针指向的对象,迫使过程中的每一步中间状态要不保留,要不就成为流式操作中的一个步骤. 方便debug

## 所有变量先声明再使用

在原始一些的C语言中,甚至无法在使用过程中声明变量,所有的变量都要在函数开头声明完. 在这个状态下,由于声明变量时实际逻辑过程还没有展开,因此完全不能够使用const来约束变量(如果这里加了const,就得赋初值,下面就不能用了)
再加上有些编译器不支持在for的第一段声明变量,导致循环的count变量都会泄漏到外边,导致了很多很恶劣的代码逻辑

``` cpp
void do_something(int x,struct* pointer){
    int count;
    int value1;
    int value2;
    int value3;
    int values;
    int sums;
    count = 0;
    while(count<x){
        value1=pointer->search_db('table');
        value2=pointer->search_db('database');
        value3=pointer->search_db('line');
        ++x;
    }
    values = count+value1*value2-value3;
    count += values>0?1:0;
    value1 = pointer->search_local('sum_stable',count);
    value2 = pointer->search_local('sum_database',count);
    value3 = pointer->search_local('sum_line',count);
    sums = count -value1/value3+value2;
}
```

+ 循环变量泄露,除了计数来用来干其他的
+ 查询变量复用,先用来作为一个的result,再用来作为另一个的查询结果
+ etc...

这种代码风格在嵌入式编程中仍然有所保留,其长期和古旧的C开发环境共生,以至于至今还在荼毒其他语言.

## Java: Calendar,final-class与并发安全,immutableCollections

### Calendar

Java中的日历类的设计很失败,比如DAY_OF_WEEK从1开始,MONTH从0开始;set没有返回值导致的无法链式处理; 内部可变诱导复用.

复用这一点很值得讨论,由于Calendar类本身内部是可变的,对对象本身set又比较简单,导致用户在操作有关联的时间时,会倾向于直接修改原始的对象.

``` java
Calendar cal1 = Calendar.getInstance();
String queryTime = DateUtils.format(cal1.getTime());
// ... many
// ...      lines
// ...            of codes
cal1.set(DAY_OF_MONTH,1);
cal1.set(MONTH,Calendar.FEBRUARY;)// instead of use int, use it's public static final varibale to avoid error
String endTime = DateUtils.format(cal1.getTime());
// ... many
// ...      lines
// ... a line that change cal1 once again
// ...            of codes
int total = searchDB(queryTime,endTime);
```

在debug模式下观察total的时候, 直接观察到的queryTime,endTime两个都对应着cal1.getTime(),但是此刻内存中的已经是变更过的了,甚至可能变更了不知道多少次.

这个时候无法直接将查询字符串和Calendar对象挂上钩,只能被迫向上分析,加上一个临时变量或者打断点在被编辑之前,来观察cal1对象的内部.

ps: 得益于完全不可变,jdk8中的java.time就能够避免这一问题

### final变量的修改可见性

Calendar的设计缺陷主要在于,其被声明后可以修改`指针指向的对象`,而如果向上文中的代码段中一样不带final声明的话,即使其不可变,仍然可能存在重复赋值,从而带来类似的问题.

final声明变量后,无法修改`指针的指向`,因此在下文使用时能够很方便的溯源到声明处,从而溯源修改链条. 如果不使用final声明,则可能从声明到使用之间,其他语句对其进行了修改,

关于这点最重要的是在版本管理中体现的,如果使用能够确保既不能修改`指针的指向`,也不能修改`指针指向的对象`,那么声明和使用变量之间的操作就**无法**对**使用变量**进行干扰, 这一点能够极大的减轻代码review过程中的压力,提高代码可维护性,确保变更不会带来意料之外的问题.

### ImmutableCollections

上文中提到需要既不能修改`指针的指向`,也不能修改`指针指向的对象`,也就更不能修改`指针指向的对象的内部字段的指向`,如此递归向下直到普通字段.

第一点通常使用final变量,确保`List<Integer> x = new ArrayList<>();`不被再次赋值
第三点通常使用类内final字段来实现,确保没有这样的操作

``` java
List<Calendar> x = new ArrayList();
x.add(Calendar.getInstance());
x.add(Calendar.getInstance());
x.get(0).set(DAY_OF_MONTH,1);
```

而第二点就得靠ImmutableCollections自己来保证了

``` java
List<Calendar> x = new ArrayList();
x.add(Calendar.getInstance());
x.add(Calendar.getInstance());
x.set(0,Calendar.getInstance()); // ban this line
```

guava通过给所有修改集合类本身的操作抛出异常来保证.

因此,通过final变量,不可变集合,类内的不可变变量的嵌套,能够使得一个对象初始化后几乎完全无法被修改,从而能够确保

+ 只要声明链条不变,其不会被变化.
+ 要对使用到的值做变更,必须显式的修改,因此能够在code-review过程中被人注意到.

综合起来可以极大减轻code-review难度,提高代码变更质量.

## 编译期常量与运行期常量

此处应该明确编译期常量和运行期常量.

|    语言    |     编译期常量      | 运行期常量 | 可修改的变量 |
| :--------: | :-----------------: | :--------: | :----------: |
|     C#     |        const        |  readonly  |  不额外修饰  |
|    C++     |      constexpr      |   const    |  不额外修饰  |
|    Rust    |        const        |    let     |   let mut    |
|    java    |        final        |   final    |  不额外修饰  |
| javascript | 解释型语言,没编译期 |   const    |     let      |

编译期的常量能够做的优化非常多,将一个编译单元内部,将变量由算式直接转换为值,利用值对分支做判断,接着进行死代码移除.

由于Java中的final不区分编译期常量和运行期常量,也不提供`constexpr function`,导致`static final`所声明的变量行为不一致

``` java
private static final long divide1 = 4L;
@Scheduled(fixedRate = divide1)
public void method1(){}
private static final long divide2 = TimeUnit.SECONDS.toMills(4);
@Scheduled(fixedRate = divide2)
public void method2(){}
```

上面的method1可执行,method2就会报错

## Rust与JavaScript-现代编程语言

如上面的表格,rust里的let声明变量默认变量不可变,通过let mut来实现可变的效果, 据[mozilla在2014年1月的调查](https://mail.mozilla.org/pipermail/rust-dev/2014-January/008329.html)中显示,let的使用量是let mut的三倍.

React官网中的变量声明实例全都是const,没有一个let.

引用知乎答主[Cat-Chen](https://www.zhihu.com/people/catchen)在[382468116](https://www.zhihu.com/question/382468116)上的回答:

> 如果你接受了 functional programming 那套，例如说 Haskell，那你已经习惯了语言中只有 const 没有 let。一旦你习惯了这种写法，你回来用 JavaScript 这种允许 functional 但不强迫 functional 的语言时你会继续坚持 functional 的习惯。这时候你的所有赋值都是一次性的，你不会再去改变它，于是你可以统一写 const 而不是 let。
>这背后实际发生的是一种编程思维模式的改变。过去你会用一个变量名来代表一个存储空间，在一系列操作的过程中不断改变这个存储空间的内容，就好像这样子：
>
> ``` javascript
> let result = initialValue;
> result += adjustment1;
> result += adjustment2;
> return result;
> ```
>
> 适应 functional 的过程中，因为所有赋值都是 const，你会停止把变量看作存储空间，你会把变量看作一个对计算结果的**取名**而已。就好比说「把距离除以时间的计算结果取名为速度」一样，目的是方便你将来在别的计算中用「速度」这个简单易懂的名字取代「距离除以时间」。
> 习惯 functional 的思维模式后，你会把上述代码写成这样子：
>
>``` java
>const afterAdjustment1 = initialValue + adjustment1;
>const afterAdjustment2 = afterAdjustment1 + adjustment2;
>return afterAdjustment2;
>```
>
> 你会对计算步骤取名字，而不是对存储空间取名字。忘却存储空间这件事情，假设 JavaScript 都能帮你打理好，不会太浪费实际存储空间，然后你会为每一个计算步骤取一个独一无二的名字，并且全部用 const。

得益于Javascript过于灵活的语法,前端工业界在code-style方面比后端更加严格,更加依赖最佳实践来节约开发成本. 代码不只是为了完成功能,还要为了可读性,可拓展性考虑.

## 编辑器染色-声明字段关键字

现代IDE中的代码染色可以大幅度提高阅读代码的速度,但是有时也很迷惑,比如idea会把基础类型`int`,`long`,`double`染色为橙色,一眼看过去就是变量; 但是却不会把String这种类的声明给染色成橙色,反而是白色. 但是,final所声明的类反而是

因此,统一采用final声明时,final起到一种声明变量符号的功能,结合染色作用,能够提高阅读速度.
