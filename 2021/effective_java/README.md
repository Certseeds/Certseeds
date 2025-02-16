---
author: "Certseeds"
date: "2021-08-11"
title: "effective java 读书笔记"
description: "effective java reading notes"
tags: ["java","effective" ]
---

# Effective Java阅读笔记

## Chapter 02 创建与销毁对象

### 02-1 使用静态方法取代构造器

1. 可以带名称. number.problemPrime(min,max)比number(min,max,random)+注释的方式容易理解的多.
2. 可以在调用时缓存对象. 比如Boolean.valueOf(boolean)其实只会返回两个对象,一个True,一个False.
3. 可以返回子类型的对象. 这一点在`List.of()`中体现的最为突出,其返回值的类型为`ListN<E>`,继承于`AbstractImmutableList -> AbstractImmutableCollection -> AbstractCollection -> Collection`,实现了`List<E>`接口.
4. 返回的对象的类可以随着每次调用发生变化. 这一条在`List.of()`中也非常明显,在无参数,参数大于两个时,返回值的类型时`ListN<E>`,但是当只有一个或者两个参数时,返回值的类型为`List12<E>`,在继承关系上与`ListN<E>`平级.
5. 方法返回的对象所属的类,在编写包含该静态方法所属的类的时候可以不存在. 返回的类可以通过依赖注入等方式进行构造.

自JDK9以来的List.of(),Map.of(),Set.of()等方法提供了比之前final static静态导入安全得多,直观的多的不可变对象,值得JDK8为之升级.

### 02-2 多个构造器参数时要考虑使用构建器(Builder)

当一个类具有多个参数,并且多个初始化时有些参数是可选项,会导致这个类产生多个参数数量不一致的构造函数,在某些更糟糕的情况下,甚至会出现多个参数数量不一致或是参数数量一致,但是参数类型顺序不一致,又或是参数类型不已知的构造方法.在这种情况下,标明在构造函数参数列表内的参数名就是几乎唯一的标志.

这样只会带来毁灭性的效果,当IDE自动提示出多种选择时,难以根据这些参数混乱不堪的构造函数构造出想要的对象.

当然,还有一些方式可以改进,

首先,可以将所有含参构造函数去掉,强制只使用无参构造函数与setter为对象赋值,当然,这样的效果也很差,参数越多行数越多,看起来乱糟糟一篇,打扰心情;

倘若再进步一些,便可以为setter的返回值设为`this`,从而允许链式赋值.

但是无论怎么改进,这种方式得到的对象里的值全都*不*是*不可变量*,影响安全.

在这里可以使用Build模式,在Object中嵌入一个Builder,来实现类中字段的final与灵活赋值兼顾.

### 02-3 私有构造器或者枚举类型强化Singleton.

常见的单例构造需要考虑是否懒加载,是否线程安全,但是还要考虑的是,反射以及反序列化时是否会影响单例,反射可以通过私有构造器抛出异常来阻止调用私有构造器,反序列化可以通过重写`readResolve`来解决问题,但是归根结底,还是使用枚举类实现的成本最低,使用Java内部的机制,又能带来安全,解决反序列化/反射带来的问题.

PS: 这里当然不是指的enum内嵌一个class或是class内嵌一个enum,而是指这个class本身把类型定义成enum.

### 02-4 私有构造器强化不可实例化

Java中没有独立的函数,即使是static函数也必须依附于一个类,如果这个类中的所有方法都是static方法,那么这个类的实例化实际上是无意义的,我们希望能够禁止对其进行实例化.

单纯的不写任何构造函数只会令JDK产生一个public的无参构造函数,手写一个private的构造函数又有被内部调用的风险,所以只能在private中直接加入throw Exception来解决.

实际上这个问题的答案更可能是Java的语法问题,C++中有指定的构造函数`=delete`功能,只要构造函数加上`=delete;`后缀,便会在编译时删去这个函数,从而令对其的调用在编译期就失败,从而从根本上解决问题.

### 02-5 优先通过依赖注入来引用资源

实际上这一条实现后,更方便与依赖注入框架合作来实现功能,同时也间接方便02-1.

### 02-6 避免创建不必要的对象

就像Boolean实际上只需要两个对象一样,不可变对象可以被重用,越是昂贵的对象就越应该考虑静态初始化,甚至直接做成枚举值.

### 02-7 消除过期的对象引用.

这一条更多出现在自定义的容器中,比如一个内部由数组实现的栈,其如果进行pop操作后没有对pop对应位置的对象标为null的话,实际上容器仍然持有其引用,会导致垃圾回收受阻.

### 02-8 避免使用终结方法与清除方法

终结方法: `finalize()`
清除方法: 继承自`Cleanable`,实现`clean()`方法.

问题在于执行时间不确定,不像析构函数,对于栈上对象来说调用的时间是确定的.而且严格来讲,不保证执行,甚至完全不执行也符合JVM做出的承诺(正如一个抛弃所有包-丢包率稳定100%的UDP协议也是符合协议内容的一样).

终结方法看上去可以被`System.gc`,`System.runFinalization`所强制调用,但是还是那句话,JVM完全可以无视其存在.至于确保可以调用的API已经被废弃了,不应该进行任何访问.

终结方法甚至会吃掉其中可能存在的异常堆栈信息.

终结方法性能拉跨,还会出现安全问题-防止攻击的办法是实现空的final的finalize方法(没感觉有哪几个实现了?也许lombok有对应注解)

也就两种情况下适合使用,第一本地不重要的一些资源,第二本地无法被GC的Native-Object.

### 2-9 try-with-resource优于try-catch

try-with-resource提供了一种类似C++中RAII的使用体验,在try()中new的对象会被编译器自动添加的finally块中调用`close()`,类似于用finally实现的析构方法.

很显然的是,既然try-with-resource背后由编译期自动生成,还是自动调用的Finally块,那么实际上try-finally没有手动实现的必要了,要做的只是把所有的资源实现`Closeable`接口.

## Chapter 03 常见方法

### 03-10,11 equals方法, hashCode方法

最佳实践之如何写equals,hashCode方法

``` java
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class rule10_equals {

    public static final class rule10_equals_class {
        private final int x;
        private final int y;
        private final int z;
        private final double time;
        private final int hash;

        private rule10_equals_class() {
            this.time = (this.x = (this.y = (this.z = 0))) * 0.0f;
            this.hash = 0;
            throw new AssertionError("should not use default");
        }

        private rule10_equals_class(int x, int y, int z, double time) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.time = time;
            this.hash = this.hashCode();
        }

        public static rule10_equals_class FOURTH(int x, int y, int z, double time) {
            return new rule10_equals_class(x, y, z, time);
        }

        private int hash() {
            return ((((31 + x) * 31 + y) * 31 + z)) * 31 + Double.hashCode(time);
        }

        public int hashCode() {
            return this.hash;
        }

        @Override
        public boolean equals(Object obj) {
            if (obj == this) {
                return true;
            } else if (!(obj instanceof rule10_equals_class)) { // 好想用模式匹配语法
                return false;
            }
            final var objc = (rule10_equals_class) obj;
            return (objc.x == this.x) &&
                    (objc.y == this.y) &&
                    (objc.z == this.z) && Double.compare(objc.time, this.time) == 0;
        }
    }

    @Test
    public void test_自反性() {
        final var obj1 = rule10_equals_class.FOURTH(1, 1, 4, 514.0d);
        Assertions.assertEquals(obj1, obj1);
        Assertions.assertEquals(obj1.hashCode(), obj1.hashCode());
    }

    @Test
    public void test_null值() {
        final var obj1 = rule10_equals_class.FOURTH(1, 1, 4, 514.0d);
        Assertions.assertNotEquals(null, obj1);
        Assertions.assertNotEquals(obj1, null);
    }

    @Test
    public void test_对称性() {
        final var obj1 = rule10_equals_class.FOURTH(1, 1, 4, 514.0d);
        final var obj2 = rule10_equals_class.FOURTH(1, 1, 4, 514.0d);
        Assertions.assertEquals(obj1, obj2);
        Assertions.assertEquals(obj1.hashCode(), obj2.hashCode());
        Assertions.assertEquals(obj2, obj1);
        Assertions.assertEquals(obj2.hashCode(), obj1.hashCode());
        Assertions.assertEquals(obj1, obj2);
        Assertions.assertEquals(obj1.hashCode(), obj2.hashCode());
        Assertions.assertEquals(obj1, obj2);
        Assertions.assertEquals(obj1.hashCode(), obj2.hashCode());
        Assertions.assertEquals(obj1, obj2);
        Assertions.assertEquals(obj1.hashCode(), obj2.hashCode());
        Assertions.assertEquals(obj1, obj2);
        Assertions.assertEquals(obj1.hashCode(), obj2.hashCode());
        Assertions.assertEquals(obj1, obj2);
        Assertions.assertEquals(obj1.hashCode(), obj2.hashCode());
        Assertions.assertEquals(obj1, obj2);
        Assertions.assertEquals(obj1.hashCode(), obj2.hashCode());
        Assertions.assertEquals(obj1, obj2);
        Assertions.assertEquals(obj1.hashCode(), obj2.hashCode());
        Assertions.assertEquals(obj1, obj2);
        Assertions.assertEquals(obj1.hashCode(), obj2.hashCode());
        Assertions.assertEquals(obj1, obj2);
        Assertions.assertEquals(obj1.hashCode(), obj2.hashCode());
        Assertions.assertEquals(obj1, obj2);
        Assertions.assertEquals(obj1.hashCode(), obj2.hashCode());
        Assertions.assertEquals(obj1, obj2);
        Assertions.assertEquals(obj1.hashCode(), obj2.hashCode());
        Assertions.assertEquals(obj1, obj2);
        Assertions.assertEquals(obj1.hashCode(), obj2.hashCode());
        Assertions.assertEquals(obj1, obj2);
        Assertions.assertEquals(obj1.hashCode(), obj2.hashCode());
        Assertions.assertEquals(obj1, obj2);
        Assertions.assertEquals(obj1.hashCode(), obj2.hashCode());
    }

    @Test
    public void test_传递性() {
        final var obj1 = rule10_equals_class.FOURTH(1, 1, 4, 514.0d);
        final var obj2 = rule10_equals_class.FOURTH(1, 1, 4, 514.0d);
        final var obj3 = rule10_equals_class.FOURTH(1, 1, 4, 514.0d);
        Assertions.assertEquals(obj1, obj2);
        Assertions.assertEquals(obj1.hashCode(), obj2.hashCode());
        Assertions.assertEquals(obj2, obj3);
        Assertions.assertEquals(obj2.hashCode(), obj3.hashCode());
        Assertions.assertEquals(obj1, obj3);
        Assertions.assertEquals(obj1.hashCode(), obj3.hashCode());
    }
}
```

对equals方法来说

1. 判断了自身与自身相等
2. 判断了类是否相同(顺带检查了null)
3. 转换参数为正确类型(如果用了带有模式匹配的新JDK,就可以整合到2)
4. 判断了每个关键域
5. 天然满足对称性, 自反性, 传递性, 一致性, 非空性.

hashCode也满足了对于相同对象散列码相同的特性, 顺带还基于不可变实现了hashcode初始化求值

### 03-13 clone接口

答案是Cloneable接口实现太差劲了,最好根本不实现这个接口,也不增加`clone()`方法,而是使用工厂方法,或者叫复制构造函数来实现相同效果.

PS: c++在这个方面做得就好不少,提供了复制构造函数来实现复制.

PSS: 硬要实现,建议内部直接报错.

### 03-14 Comparable接口

直接看代码

``` java
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.StringJoiner;

public final class rule14_comparable {
    // 排序,很神奇吧
    @Test
    public void test() {
        // final只限制了不能再给comparableList赋值
        // 数组中元素仍可以发生变化
        final var comparableList = new showComparable[]{
                showComparable.newCompare(1, 1),
                showComparable.newCompare(4, 5),
                showComparable.newCompare(1, 4),
                showComparable.newCompare(1, 9),
                showComparable.newCompare(1, 9),
                showComparable.newCompare(8, 1),
                showComparable.newCompare(0, 4),
        };
        System.out.println(Arrays.toString(comparableList));
        Arrays.sort(comparableList);
        System.out.println(Arrays.toString(comparableList));
        System.out.println(List.of(comparableList));
    }

    private final static class showComparable implements Comparable<showComparable> {
        private final int x;
        private final int y;

        private showComparable() {
            throw new AssertionError("should not use default");
        }

        private showComparable(int x, int y) {
            this.x = x;
            this.y = y;
        }

        public static showComparable newCompare(int x, int y) {
            return new showComparable(x, y);
        }


        /**
         * @param o : a object
         * @return: 如果this比o x更大,或者x想等情况下y更大,则返回1
         * 若x,y相同,返回0,
         * 否则返回-1
         */
        @Override
        public int compareTo(showComparable o) {
            // 自反性, 可以保证
            // 对称性, 可以保证
            // 可传递, 可以保证
            // obj1.compareTo(obj2) == 0 确保内部每一个元素进行compareTo都相同,可以保证
            // (obj1.compareTo(obj2) == 0) == (obj1.equals(obj2)) 可以保证
            // int,long这种整型可以用> <
            // float,double就得用Float.compare,Double.compare了
            // 整形用Integer.compare显得傻傻的,很不舒服
            if (this.equals(o)) {
                return 0;
            }
            if (this.x > o.x || (this.x == o.x && this.y > o.y)) {
                return 1;
            }
            return -1;
        }

        private static final Comparator<showComparable> OLD_COMPARABLE_COMPARATOR = Comparator
                .comparingInt((showComparable o) -> o.x) // 需要写类型,不优雅
                .thenComparing(o -> o.y);
        private static final Comparator<showComparable> COMPARABLE_COMPARATOR = Comparator
                .<showComparable>comparingInt(o -> o.x) // 这样剥离类型更优雅
                .thenComparing(o -> o.y);

        //@Override
        public int compareTo2(showComparable o) {
            // 自反性, 可以保证
            // 对称性, 可以保证
            // 可传递, 可以保证
            // obj1.compareTo(obj2) == 0 确保内部每一个元素进行compareTo都相同,可以保证
            // (obj1.compareTo(obj2) == 0) == (obj1.equals(obj2)) 可以保证
            // 主要用在那些想要自定义比较,但是无法重写要排序的类的地方,传一个比较函数过去而不需要对类本身进行修改
            return COMPARABLE_COMPARATOR.compare(this, o);
        }

        @Override
        public String toString() {
            return new StringJoiner(", ", showComparable.class.getSimpleName() + "[", "]")
                    .add("x=" + x)
                    .add("y=" + y)
                    .toString();
        }

        @Override
        public boolean equals(Object obj) {
            if (obj == this) {
                return true;
            } else if (!(obj instanceof showComparable)) { // 好想用模式匹配语法
                return false;
            }
            final var objc = (showComparable) obj;
            return (objc.x == this.x) &&
                    (objc.y == this.y);
        }
        @Override
        public int hashCode() {
            return 31 * x + y;
        }
    }
}
```

## Chapter 04 类和接口

### 04-15,16 类和成员的访问最小化,使用访问方法而非

显然,一旦一个类公开某个属性,(作为一个负责任的包开发者),这个属性就无法再做任何修改,因为总会有人对这个属性做出依赖.

所以,别问,问就所有都是private,只能通过get方法来获取()

PS: 顺带一提,返回private数组是一个常见错误,因为这只令数组不可变,数组元素依然可变,所以最好用`List.of()`带来的不可变集合代替.

### 04-17 最小化可变性

1. 所有字段都是private
2. 所有字段都没有set方法
3. 所有字段都是final
4. 类本身就是final
5. 就算有可变属性,也要保证外部无法获取.

不可变的对象在并发等场景都有很好的适用性,只是会浪费一点内存罢了.

### 04-18 复合优于继承

继承最大的问题在于,对于外界类的继承,在外界类发生变化时,其正确性无法保证.

所以建议使用转发类+实现类两个类来实现.

只有当类是自己手写的时候,或者超类完全为继承所设计,并且子类与超类确实存在`is-a`关系的时候,再使用继承吧.

### 04-19 继承需要专门设计,不然不如继承

上文说了,超类得为子类设计才能用继承,正因如此,

继承是需要**设计**的,需要完整的文档,文档说明内部每个方法的实现与坑,

不仅是文档,还是要通过编写子类来测试,展示子类继承时的体验.

并且,既然继承需要专门设计,那么没有专门设计的就不能继承-将他们全部作为`final class`吧

### 04-20 接口优于抽象类

如果说之前的接口,因为没有默认实现,劣于抽象类的化,现在的接口有了默认实现,明显比只能单继承的抽象类要好.

更好的方式是,接口定义方法,提供某些默认实现,抽象骨架类拓展接口,定义出基本的实现.

### 04-21 为后代设计接口

接口的设计不仅要说明对外的public方法,一些方便子类内部方法的私有方法也需要写出.

后续的接口也许无法纠正,用新的接口取代吧.

### 04-22 接口用来定义类型

**不要用interface声明public static final变量!**

用枚举或者static final常量取代他们

### 04-23 类层次优于标签类

与其用枚举标明类的种类,不如直接声明多个类来区别类型.

### 04-24 静态成员类 优于非静态成员类

非静态成员类内部内嵌了一个外部类的引用,这有用吗?大多数时间没用.

所以不如全都用静态成员类,结合自动类型推导,不需要在左边写那么长的类型,香疯了.

### 04-25 源文件为单个顶级类

一个文件里不应该,也不允许有多个public class,这没有任何可行的理由.


## chapter 05 泛型

[泛型](http://blog.certseeds.com/2021/effective_java/chapter05)


## Chapter 12 序列化

### 12-1 序列化*问题很大*

序列化过程中,如果只涉及基本类型及其包装类型的话,当然较为安全,但是一旦涉及到包装类,如HashMap,HashSet等类,很容易被意想不到的方式攻击

最典型的莫过于HashMap嵌套问题,

假设有2n+1个对象

根对象左节点,右节点分别为1st,2nd

1st的左节点为3rd,右节点4th,而2nd的左右节点与1st相同

3rd的左节点为5th,右节点6th,而4th的左右节点与3st相同

相当于每一层只有两个节点,但是每一层的每个节点都被上一层的每个节点当作左节点或右节点.

这样层层嵌套下去,只需要2n+1个对象,就构造出了高达2^n个对象,导致时间爆炸.

解决方案是什么呢?

答案是使用json等简单格式,但是json是怎么处理嵌套问题攻击呢?

答案是没有处理, 但是json格式如果对应上述的层层嵌套对象, 那么首先对应的 需要解析的字符串就会超级长, 在这一点上, json格式无法表达引用这一点反而成为了优势, 因为这强迫使得json格式的输入规模与输出规模相匹配, 反序列化炸弹自己在输入规模上就露馅了.

*PS:fastjson似乎有引用这一feature,很好奇他们对此的意见*

由于反序列化这一过程涉及到了完全无法预计的引用,所以最好**不要使用**反序列化,应该用json或者protobuf代替.

替代不了的可以用白名单过滤,只允许那些可信任的类,只序列化那些可信任的数据.

### 12-2 Serializable 谨慎实现

Serializable实现之后,其序列化的形式就变成了对外接口的一部分,如果没有良好的设计,那么这个隐式的对外接口将会为后续的开发带来麻烦.

Serializable这种接口只有标记作用,其中没有默认实现,但是又有与其行为绑定的序列化,反序列化函数,这些隐式实现的函数(尤其是反序列化函数)是隐藏的构造器,很容易反序列化出不符合标准的对象.

为了继承设计的类应该尽量少的实现Serializable接口,用户接口也应该尽量少的实现Serializable接口,避免迫使使用者实现.

Serializable只在可信环境+可控数据下较为安全,不要将其作为对外交互的任何方式.

PS: Serializable接口的设计太失败了,至少也得有`writeObject`,`readObject`,`getSerialVersionUID`这三个方法吧.
PSS: 其实还是设计的锅,Interface之前没办法加入默认实现,所以没办法把这些方法加到接口内.现在积重难返

### 12-3 使用自定义的序列化形式

其实可以类比成,既然序列化形式应该尽量不使用,那么我们可以把序列化的格式转化成json,反序列化也是从json中反序列化,直接把所有属性都标明`transient`,全部手动转换.

### 12-4 使用保护性的`readObject`,`validateObject`

令readObject中对输入数据进行复制再赋值,并调用`validateObject()`对对象做校验,更一般的是,可以令构造函数也调用`validateObject()`,简化逻辑

### 12-5 示例控制-枚举优先于readResolve

这一项有可能有点绕口,但是无论如何,单例的实现都应该用枚举类型.

+ 构造器
+ 反射
+ 反序列化
+ Clone,

1. PS: `Cloneable`接口是公认的不推荐使用,一般根本不会有人主动实现`clone()`方法,不需要考虑.

2. 反射我们将私有构造器抛出异常来实现初级的防御,但是总是会有一个构造器不抛出异常,如果被反射调用了还是会被破坏,怎么办呢?

答案是标志位,当然,其实标志位也是防君子不防小人的,反射完全可以修改私有字段来实现对flag的屏蔽.

由此可见,反射的攻击相当难办,最好还是想点别的办法.

3. 反序列化,反序列化可以通过`readResolve`来防御,但是这也是防君子不防小人,可以构造出序列化的流,其中将类的字段以`fake`类来代替,`fake`类内又引用类,`fake`类的`readResolve`又返回被代替的字段的值,实现对反序列化的攻击.当然,最终的解决办法是不在类中放置任何可被藏身的字段-给所有字段加以`transient`,但是这样问题又来了,这样还搞什么序列化呢?

4. 构造器的攻击显然可以被忽略

由此可见,如果要实现一个单例,要考虑的事情几乎是无限的,还是JDK内置的enum靠谱

### 12-6 考虑使用序列化代理代替序列化实例

类内嵌一个proxy静态内部类,令外部类的`writeReplace`(PS: 又一个接口里不提但是明显与接口有关的特殊方法)返回这个proxy静态代理类的示例,之后序列化生成的就是这个代理类,然后这个代理类的`readResolove`调用外部类的构造器,来保证安全性.好处就是把`readObject`可以彻底放弃了,反序列化也导向了构造器,外部类自身也可以设置为final.

PS: 与单例无关

PSS: 再次统计一下,Serializable接口的设计真的太失败了,至少也得有`getSerialVersionUID`,`readObject`,`writeObject`,`readResolve`,`writeReplace`,`readObjectNoData`这六个方法吧.

### TODO

注: 发布于GitHub的本文采取CC-BY-NC-SA-4.0 or any later version,保留在其他平台采取不同许可证的权利-转发链路不同导致的许可证不同问题,请通过到源发布平台转发来解决.
注2: 本文中所有代码部分采取MIT协议,保留在其他平台采取不同许可证的权利-转发链路不同导致的许可证不同问题,请通过到源发布平台转发来解决.
