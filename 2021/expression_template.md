---
author: "Certseeds"
date: "2021-10-24"
title: "expression template"
description:  "expression template"
tags: ["cpp", "cpp-template"]
---

# 表达式模板-Expression Template

三个矩阵相加,需要几步?

一般需要两步: 第一个矩阵+第二个矩阵, 生成一个矩阵一又二分之一, 一又二分之一 + 第三个矩阵, 产生结果.

推广一下, N个矩阵相加, 会产生N-1个中间矩阵, 很显然,在内存分配上是极大的挑战, 纵使临时矩阵运算完后可以销毁, 内存一次申请一次析构,也浪费时间.

有没有方式能规约掉这N-1个矩阵? 让这些矩阵只有一份的内存消耗? 

## 普通方法

有, 当然有, 只要不拘泥于形式, 不写成`Matrix1 + Matrix2 + ... + MatrixN`这样直接写,而是写一个循环

``` cpp
const auto Matrix_vector{Matrix1,Matirx2,...,MatrixN};
matrix_result = new Matrix(row,col)
for(size_t x{0}; x < row;x++){
    for(size_t y{0}; x < col;y++){
        //sum实现请自行想象
        matrix[x][y] = sum(Matrix_vector.cbegin(),Matrix_vector.cend(),x,y,[](Matrix m,auto x,auto y){return m[x][y]});
    }
}
```

复杂点来写,总还是可以写出来的, 中间矩阵无非是简化运算的临时产物罢了.

那么有没有办法, 能够即简单写,又简化运算?

## 表达式模板

### 重载运算符

首先, 要简单写 + -这一类符号,就需要重载运算符来实现,

### 构建表达式模板

先抛开简写, 倘若是比较复杂的撰写,会如何进行操作?

显而易见的是, 这种代数运算可以被构建为一颗 计算树, 其叶子节点为操作对象,非叶子节点为运算符,自下而上运算,最后归约到根节点,产生结果.

当然,可以手动去构建,但是这样有点复杂. 此时放眼前看, 这个计算树的类型构建操作可以放到编译期, 运行期先通过重载运算符将树建立起来, 最后通过一个"调用"操作, 将值一口气计算出来.

而这个调用操作, 非"拷贝构造函数/拷贝赋值运算符/移动构造函数/移动赋值运算符"这几个重载`operator=`的函数莫属, 这样不仅实现了优化计算,还实现了惰性求值.

### 代码实现

如果只是`matrix1 + matrix2`,那么重载运算符还能对付得过来,但是一旦多起来, 不同类型时间该如何重载运算符?

答案是使用[奇异递归模板模式,CRTP](http://certseeds.github.io/Certseeds/posts/2021/crtp_class_extend_itself), 通过基类`Expression`来统一 "矩阵"与"多个矩阵的操作树"

``` cpp
template<typename T>
struct Expression {
    // returns const reference of the actual type of this expression
    const T &cast() const { return static_cast<const T &>(*this); }
    size_t rows() const { return cast().rows(); }// get Expression size
    size_t cols() const { return cast().cols(); }// get Expression size
// template binary operation, works for any expressions
private:
    Expression &operator=(const Expression &) = default;
    Expression() = default;
    Expression(Expression &&node) = default;
    Expression &operator=(Expression &&node) = default;
    friend T;
};
```

用于CRTP继承的基类

``` cpp
template<typename Func, typename TLhs, typename TRhs>
struct BinaryOp : public Expression<BinaryOp<Func, TLhs, TRhs> > {
    BinaryOp(const TLhs &lhs, const TRhs &rhs) : lhs_(lhs.cast()), rhs_(rhs.cast()) {}
    // work function, computing this expression at position i, import for lazy computing
    auto value(size_t i, size_t j) const {return Func::Op(lhs_.value(i, j), rhs_.value(i, j));}
    size_t rows() const { return std::min(static_cast<size_t>(lhs_.rows()), static_cast<size_t>(rhs_.rows())); }
    size_t cols() const { return std::min(static_cast<size_t>(lhs_.cols()), static_cast<size_t>(rhs_.cols())); }
private:
    const TLhs &lhs_;const TRhs &rhs_;
};
```

继承了基类的"操作树"类型,通过模板方式,存储操作符与左右子节点, 这里由于模板的强大表达力, 左右子节点可以为几乎任何任何类型,但是奇怪的是, 这里的构造函数到底被谁调用呢? 没有人会手写声明BinaryOp

``` cpp
template<typename Func, typename TLhs, typename TRhs>
requires(is_OPERATOR<Func>)
static inline BinaryOp<Func, TLhs, TRhs> expToBinaryOp(const Expression<TLhs> &lhs, const Expression<TRhs> &rhs) {
    static_assert(is_OPERATOR<Func>);
    return BinaryOp<Func, TLhs, TRhs>(lhs.cast(), rhs.cast());
}
```

BinaryOp的声明统一由另外一个相当于工厂方法的方法来构造, 可以看到,此处进行模板类型匹配时, TLhs会除去外层Expression, 从而传入原始类型TLhs

而此处的requires则是C++20语法,声明了一个"函数运算符接口"

``` cpp
template<typename T>
concept is_OPERATOR = requires(T f) {
    T::Op(f, f);
    std::constructible_from<T>;
    std::default_initializable<T>;
    sizeof(T) == 1;
};
```

要求运算符
+ 具有静态函数 并可以传入两个自己类型的值作为参数(说明实现了泛型Op函数)
+ 可以默认构造
+ 可以无惨构造
+ sizeof(==1) <=> 只有静态函数,内部没有任何对象

比如

``` cpp
struct Add {
    template<typename T1>
    static T1 Op(T1 a, T1 b) {
        return a + b;
    }
};
```

而那些实现类只需要继承`Expression<${CLASS_ITSELF}>`
实现接口, 并拓展如下的重载运算符

``` cpp
template<typename T1, typename T2>
inline EXPRESSION::BinaryOp<Add, T1, T2>
operator+(const Expression<T1> &lhs, const Expression<T2> &rhs) {
    return expToBinaryOp<Add>(lhs, rhs);
}
```

实现下面的的赋值运算符

``` cpp
template<typename ExpType>
    Matrix<T> &operator=(Expression<ExpType> &&src) {
        if (this == reinterpret_cast<Matrix<T> *>(&src)) {
            return *this;
        }
        const ExpType &srcReal = src.cast();
        this->vec.resize(srcReal.rows());
        for (size_t i{0}; i < srcReal.rows(); i++) {
            this->vec[i].resize(srcReal.cols());
            for (size_t j{0}; j < srcReal.cols(); j++) {
                this->vec[i][j] = srcReal.value(i, j); // binary expression value work function
            }
        }
        return *this;
    }
```

即可

但是,实际使用中还是存在问题,实际上解决起来颇具困难.

### 表达式模板也有难处

#### 太多的构造函数

"拷贝构造函数/拷贝赋值运算符/移动构造函数/移动赋值运算符" 加起来就四个了, 而且这四个由于父类用友元+私有函数实现的, 必须显式声明, 不能用下面的模板函数代替.

然后还得有四个 加上了形如下面的模板参数的函数,来负责给最终的"计算树"赋值做重载, 一来一回就有八个函数. 虽然说拷贝一组,移动一组,组内可以用类似 `Matrix(const Matrix<T> &mat) {this->operator=<Matrix<T>>(mat);}`的方式来节约代码量,但是还有有足足八个函数,两个实现+六个转发.

``` cpp
    template<typename ExpType>
    Matrix<T> &operator=(const Expression<ExpType> &src);
```

#### 难以拓展

这样实现的类,如果要加一个数字,则又需要花一番功夫,得用requires约束左右模板参数的类型,又得声明一个number类型,负责计算节点时返回number的值.

#### 表达范式单一

可以很容易的观察到,最终的延迟计算函数中, 基本的计算方式已经确定,如果要实现矩阵乘除法这类不是一对一,点对点的计算的话,现阶段还没有什么更好的解决办法.

## 总结

折叠表达式利用重载计算符号和赋值符号,实现了编译期构建表达式类型树,运行期低成本构建树,并延迟计算. 只不过表达能力收到编译期的限制,威力有限.




注: 本文所有代码均为AGPL3.0协议, 而本文文本在GitHub的备份自身为CC-BY-NC-SA-4.0协议.

注2: 文本部分代码来自 `https://blog.csdn.net/daniel_ustc/article/details/74857956`