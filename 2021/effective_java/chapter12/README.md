<!--
 * @Github: https://github.com/Certseeds/words
 * @Organization: SUSTech
 * @Author: nanoseeds
 * @Date: 2021-08-11 23:10:21
 * @LastEditors: nanoseeds
 * @LastEditTime: 2021-08-19 00:06:20
 * @License: CC-BY-NC-SA_V4_0 or any later version
  -->

# Effective Java阅读笔记

## [WIP] Chapter 12 序列化

### 12-1 序列化*问题很大*

序列化过程中,如果只涉及基本类型及其包装类型的话,当然较为安全,但是一旦涉及到包装类,如HashMap,HashSet等类,很容易被意想不到的方式攻击

最典型的莫过于HashMap嵌套问题,

假设有2n+1个对象,</br>
根对象左节点,右节点分别为1st,2nd</br>
1st的左节点为3rd,右节点4th,而2nd的左右节点与1st相同</br>
3rd的左节点为5th,右节点6th,而4th的左右节点与3st相同</br>
相当于每一层只有两个节点,但是每一层的每个节点都被上一层的每个节点当作左节点或右节点.
这样层层嵌套下去,只需要2n+1个对象,就构造出了高达2^n个对象,导致时间爆炸.

解决方案是什么呢?
答案是使用json等简单格式,但是json是怎么处理嵌套问题攻击呢?

答案是没有处理,但是json格式如果对应上述的层层嵌套对象,那么首先对应的 需要解析的字符串就会超级长,在这一点上,json格式无法表达引用这一点反而成为了优势,因为这强迫使得json格式的输入规模与输出规模相匹配,反序列化炸弹自己在输入规模上就露馅了.
*PS:fastjson似乎有引用这一feature,很好奇他们对此的意见*

由于反序列化这一过程涉及到了完全无法预计的引用,所以最好**不要使用**反序列化,应该用json或者protobuf代替.

替代不了的可以用白名单过滤,只允许那些可信任的类,只序列化那些可信任的数据.

## 12-2 Serializable 谨慎实现

Serializable实现之后,其序列化的形式就变成了对外接口的一部分,如果没有良好的设计,那么这个隐式的对外接口将会为后续的开发带来麻烦.

Serializable这种接口只有标记作用,其中没有默认实现,但是又有与其行为绑定的序列化,反序列化函数,这些隐式实现的函数(尤其是反序列化函数)是隐藏的构造器,很容易反序列化出不符合标准的对象.

为了继承设计的类应该尽量少的实现Serializable接口,用户接口也应该尽量少的实现Serializable接口,避免迫使使用者实现.

Serializable只在可信环境+可控数据下较为安全,不要将其作为对外交互的任何方式.

PS: Serializable接口的设计太失败了,至少也得有`writeObject`,`readObject`,`getSerialVersionUID`这三个方法吧.
PSS: 其实还是设计的锅,Interface之前没办法加入默认实现,所以没办法把这些方法加到接口内.现在积重难返 

## 12-3 使用自定义的序列化形式

其实可以类比成,既然序列化形式应该尽量不使用,那么我们可以把序列化的格式转化成json,反序列化也是从json中反序列化,直接把所有属性都标明` transient`,全部手动转换.

## 12-4 使用保护性的`readObject`,`validateObject`

令readObject中对输入数据进行复制再赋值,并调用`validateObject()`对对象做校验,更一般的是,可以令构造函数也调用`validateObject()`,简化逻辑

## 12-5 示例控制-枚举优先于readResolve - TODO

## 12-6 考虑使用序列化代理代替序列化实例 - TODO


[Back to Home](./../README.md)