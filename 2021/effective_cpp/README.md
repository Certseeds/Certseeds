---
author: "Certseeds"
date: "2021-09-12"
title: "effective cpp reading notes"
description: "effective cppp reading notes"
tags: ["cpp", "effective" ]
---

# [WIP] Effective Cpp 读书笔记

## 习惯C++

### Item 01 C++是一个语言联邦

诚然最初的C++只是C with Classs,但是现在C++已经更激进,更冒险,有更多的编程范式.

c++现在同时支持过程式,面向对象,函数式,泛型,元编程形式多种范式,语法繁复异常,应当如何掌握?

建议将C++理解为多个部分的综合,可以分成几个部分

+ c

绝大多数C语言的代码可以直接用C++编译器编译: Cpp现在仍然兼容绝大部分C语法(并且将此作为基础),基本语句,预处理器,内置的int,long,double,float,数组与指针都来自此.

+ 面向对象

提供了基本的对象语法,面向对象三件套-封装继承多态,虚函数,

+ 模板

提供了泛型能力,还(在意外中)实现了模板元编程

+ STL-Stnandard Template Libiary标准模板库

预置提供了大部分方便开发的容器,迭代器,算法与函数对象

PS: 虽然这么讲,但是(从零开始)学习其实从STL学起,并发学习c与面向对象语法,最后接触模板比较舒服

每个部分都有自己的偏好,基础类型偏好 *pass-by-value*,但是一旦迁入class就偏好于*pass-by-reference-to-const*, 模板部分也是如此,而函数指针,迭代器等对象又回到了*pass-by-value*

### item 02 使用const,enum(class),inline替换#define

倒不如说是尽量用编译器取代预处理器,

#### const 取代 #define

1. 预处理器进行的处理不进入符号表

预处理器直接进行替换,于是debug模式下只能看到替换后的结果,看不到值,无法反向追踪回去.

2. 预处理器有泄露风险

除非明智的在头文件中进行了`#undef`,不然会泄露出去宏定义,别人的宏定义也有可能泄露进来,造成不可知的影响

#### enum 取代 #define

常见于给一堆东西赋值的时候,这个时候不如直接用枚举,名字作为识别项.

PS: 请勿使用enum作为数组的长度, Modern CPP已经有了`constexpr`这个解决方案

#### inline 取代 #define

宏函数可以认为是显式使用的内联,直接在预处理器 将函数嵌入到调用方,但是

1. 难以调试,看到的代码和调试的代码不一致

2. 宏函数的实现有风险,需要加上许多括号保证顺序正确性.

建议使用inline + 模板函数来取代(就像STL中的`std::max`)

### item 03 尽可能多的使用const

尽量多的使用不变性有助于编译器进行更激进的优化.

#### `const char* const str="12345"`

这个声明内部有两个const,分别都有什么含义?

left hand const 代表这个指针不能被指向另一个地址,不能再被赋值 `str="23456"`
right hand const 代表这个指针指向的地址也不能修改,即不能做 `str[0]='2'`这样的操作.

在这两个情况下,这个指针变量才具有不可变性.

#### const 成员函数

const成员函数-给const variable调用时调用不同的函数(因为const版的返回值要求也不一样,所以需要不同函数),代码示范如下

``` c++
#include <string>
#include <utility>
using std::string;
struct TextBlock{
    const char& operator[](std::size_t position) const{
        std::cout << "invoke const" << std::endl;
        return text[position];
    }
    char& operator[](size_t position){
        std::cout << "invoke normal" << std::endl;
        return text[position];
    }
    explicit TextBlock(string text) : text(std::move(text)) {}
private:
    string text;
};
static void print(const TextBlock& ctb){
    ctb[0];
}
int main(){
    TextBlock tb{"tb"};
    const TextBlock ctb{"tb2"};
    tb[0];
    ctb[0];
    print(ctb);
    tb[0]='?'; // can
    // ctb[0] ='?'; // can not compile
}
```

输出

``` log
invoke normal
invoke const
invoke const
```

##### const成员函数的含义

const成员函数到底意味着什么? 如果只是说,内部成员变量,或者说内部这个对象内存上任何一个bit不变的话,方便编译器侦测,但是有时会被绕过- 一个没有右侧const的指针变量即可做到这一点.

既然这样行不通(其实应该加强到所有指针变量都是双份const,etc...),那就有了更放松的标准,使用mutable释放掉 `一个bit也不变`这样的要求.

#### 复用代码

有时候虽然const,与非const的代码不是一个函数,但是逻辑完全一致(比如上面的例子),这样能不能直接复用代码?

显然,不能用const去掉非const,这样会有意想不到的变动出现,非const调const则不然,加强版的约束不会破坏掉弱约束.

``` cpp
#include <string>
#include <utility>
using std::string;
struct TextBlock {
    const char &operator[](std::size_t position) const {
        std::cout << "invoke const []" << std::endl;
        return text[position];
    }
    char &operator[](size_t position) {
        std::cout << "invoke normal []" << std::endl;
        return text[position];
    }
    const char &operator()(std::size_t position) const {
        std::cout << "invoke const ()" << std::endl;
        return text[position];
    }
    char &operator()(size_t position) {
        std::cout << "invoke normal ()" << std::endl;
        return const_cast<char &>(
                static_cast<const TextBlock &>(*this)(position)
        );
    }
    explicit TextBlock(string text) : text(std::move(text)) {}
private:
    string text;
};
static void print(const TextBlock &ctb) {
    ctb[0];
}
int main() {
    TextBlock tb{"tb"};
    const TextBlock ctb{"tb2"};
    tb[0];
    ctb[0];
    print(ctb);
    tb[0] = '?'; // can
    // ctb[0] ='?'; // can not compile
    ctb(0);
    tb(0)='?'; // can compile
}
```

用两次强制转型实现了调用

### item04 使用对象前先初始化

有些时候,定义一个变量似乎默认给了值,比如`int x;`大多数时间x为0

但是更复杂的自定义类型,比如`struct point{int x,y;}` 直接用`point p;`来定义的话,其成员变量有时被初始化,有时则没有.

对于现代C++来说,`{}`大括号赋值已经统一了绝大多数初始化领域.

#### 内置类型

使用大括号初始化

``` cpp
int x{2}; // 初始化为2
double y{1.23456} // 初始化为1.23456
```

PS:很明显,没有任何人会用不初始化的指针.

#### 自定义类型

此时大括号初始化会去调用类的构造函数.在现代c++中

一些绝对不会更改的值,直接在类中使用大括号赋值将其初始化

``` cpp
class people{
    int32_t age{0};
    bool male;
    vector<string> schools;
}
```

另外需要依赖外来值来初始化的值,使用 initialization list来实现 `初始化`而非`赋值`

``` cpp
people(bool male_,const vector<string>& schools_): male(male_),schools(schools_) {}
```

这样效率更高,直接使用值来拷贝构造,而非先构造再赋值.

如果不想给值,而是像调用成员的默认构造函数,直接使用空括号

``` cpp
explicit people(bool male_): male(male_),schools() {}
```

#### 跨编译单元的non-local static对象

如果两个编译单元内的 non-local static对象(比如类的静态成员变量)存在依赖关系,这样的依赖关系需要额外的手段来确保不被破坏-cpp只对单一编译单元内的初始化顺序有保证.

1. 使用方法取代

旧的Object1

``` cpp
static Object1;
```

新的Object1

``` cpp
Object1& object1(){
    static Object1 obj1;
    return obj1;
}
```

这样让初始化后移到第一次调用时,避免问题产生.

PS: 当然,这样在多线程下不好说,但是建议多线程情况下,在单线程的启动期手动保证单例.

注: 发布于GitHub的本文采取CC-BY-NC-SA-4.0 or any later version,保留在其他平台采取不同许可证发布的权利-转发链路不同导致的许可证不同问题,请通过到源发布平台转发来解决.