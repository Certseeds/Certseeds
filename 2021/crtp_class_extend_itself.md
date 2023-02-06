---
author: "Certseeds"
date: "2021-10-09"
title: "crtp class extend itself"
description: "crtp class extend itself"
tags: ["cpp", "cpp-template"]
---

# 奇异递归模板模式 CRTP

## 问题起因

二叉树,一般情况下基本组成部分如下

``` cpp
struct TreeNode{
    int32_t val{0};
    TreeNode* left{nullptr},*right{nullptr};
};
```

更进一步的话,通过模板摆脱数据类型限制

``` cpp
template<typename T>
struct TreeNode{
    T val{static_cast<T>(0)};
    TreeNode<T>* left{nullptr},*right{nullptr};
};
```

这样的节点对全靠手动操作的,比较基础的二叉树很适合,但是对于更复杂的树,比如二叉平衡树AVL-tree,红黑树RB-tree来讲,需要在节点中存放更多信息.

这种情况下,常见的实现有

``` cpp
template<typename T>
struct AVLTreeNode{
    T val{static_cast<T>(0)};
    size_t height{0};
    AVLTreeNode<T>* left{nullptr},*right{nullptr};
};
```

看到这里的实现,不禁令人思考,既然TreeNode与AVLTreeNode有这么多重复之处,是否有办法能够提取共同之处?

## 基础实现

最基础的实现为继承,即

``` cpp
template<typename T>
struct TreeNode{
    T val{static_cast<T>(0)};
    TreeNode<T>* left{nullptr},*right{nullptr};
};
template<typename T>
struct AVLTreeNode : public TreeNode<T>{
    size_t height{0};
};
```

缺点在于,由于AVLTreeNode内部存储的为`TreeNode<T>`,而非是`AVLTreeNode<T>`,因此无法使用`x.left->height`来访问左右节点的

临时的解决方案: 1. 使用内部的包装函数,`left()`获取left,之后在`left`内进行类型转换.

+ static_cast: 没有运行时消耗,但是缺点在于并不安全.
+ dynamic_cast: 运行时安全,但是缺点在于运行时有消耗,并且需要至少一个虚函数(虚析构函数也可以充数)

并且用起来得是`x.left()->height`这样访问,使用体验还是挺差的

## CRTP 实现

### CRTP 基础实现

上面的缺点在于"父类中的left,right不是子类指针",这一点如果想要绕过,就要让子类继承父类时传入额外的信息(很显然,只能通过模板方法传入)

基础实现如下

``` cpp
template<typename T, template<typename> typename CLASS> // 不要直接用 typename CLASS,传入 CLASS<T>,那样规约能力不足,需要有三个因素要考虑
struct TreeNodeTemp {
public:
    T val;
    CLASS<T> *left, *right;
    explicit TreeNodeTemp(T x = static_cast<T>(0)) : TreeNodeTemp<T, CLASS>(x, nullptr, nullptr) {};
    TreeNodeTemp(T x, CLASS<T> *le, CLASS<T> *rig) : val(x), left(le), right(rig) {};
    virtual ~TreeNodeTemp() {}
};
template<typename T>
struct TreeNode : public TreeNodeTemp<T, TreeNode> {
private:
    using base = TreeNodeTemp<T, TreeNode>;
public:
    explicit TreeNode(T x) : base(x) {}

    size_t height{};

    ~TreeNode() override =default();
};
```

通过 CRTP以及模板参数的传入,成功的"继承了自己",实现了奇异递归模板.

下方TreeNode的实现,可以理解为

``` cpp
// part I
template<typename T>
struct TreeNode;
// part II
struct TreeNodeTemp_T_TreeNode {
public:
    T val;
    TreeNode<T> *left, *right;
    explicit TreeNodeTemp_T_TreeNode(T x = static_cast<T>(0)) : TreeNodeTemp_T_TreeNode(x, nullptr, nullptr) {};
    TreeNodeTemp_T_TreeNode(T x, TreeNode<T> *le, TreeNode<T> *rig) : val(x), left(le), right(rig) {};
    virtual ~TreeNodeTemp_T_TreeNode() {}
};
// part III
template<typename T>
struct TreeNode : public TreeNodeTemp_T_TreeNode {
private:
    using base = TreeNodeTemp_T_TreeNode;
public:
    explicit TreeNode(T x) : base(x) {}

    size_t height{};

    ~TreeNode() override =default();
};
```

先声明自己,再声明了一个通过模板实现的实质上的匿名类, 之后被自己所继承. 实际上并没有出现什么 太过于难以想象的事情.

### CRTP 提升一

上方的描述中存在问题,假设`struct TreeNode: public TreeNodeTemp<T,TreeNotNode>` 继承的时候继承的不是自己,应该使用什怎样的方式来规避呢?

经典做法是使用`友元`来解决问题

``` cpp
template<typename T, template<typename> typename CLASS>
struct TreeNodeTemp {
public:
    T val;
    CLASS<T> *left, *right;
private:
    explicit TreeNodeTemp(T x = static_cast<T>(0)) : TreeNodeTemp<T, CLASS>(x, nullptr, nullptr) {};
    TreeNodeTemp(T x, CLASS<T> *le, CLASS<T> *rig) : val(x), left(le), right(rig) {};
    friend CLASS<T>;
};
template<typename T>
struct TreeNode : public TreeNodeTemp<T, TreeNode> {
private:
    using base = TreeNodeTemp<T, TreeNode>;
public:
    explicit TreeNode(T x) : base(x) {}

    size_t height{};

    ~TreeNode() override =default();
};
```

将父类的构造函数全部置为私有,并声明友元,这样只有继承了自己的类才能调用父类的构造函数,从而从编译期确保了两者一致.

### CRTP 提升二

假设有一个TreeNodeSub类想要继承TreeNode,这应该如何是好?TreeNode 只有一个参数,无法传入CLASS

这里就无法单纯的增加一个模板参数来解决了,倘若在声明时给模板参数加入默认值,则只会发现此时类型还没有声明,无法使用.
这时候就需要使用模板声明了. 两者叠加起来,单独使用时使用默认值,被继承时可以传递出类型参数

``` cpp
template<typename T, template<typename> typename CLASS>
struct TreeNodeTemp {
public:
    T val;
    CLASS<T> *left, *right;
private:
    explicit TreeNodeTemp(T x = static_cast<T>(0)) : TreeNodeTemp<T, CLASS>(x, nullptr, nullptr) {};
    TreeNodeTemp(T x, CLASS<T> *le, CLASS<T> *rig) : val(x), left(le), right(rig) {};
    friend CLASS<T>;
};
template<typename T, template<typename> typename CLASS>
struct TreeNode;
template<typename T, template<typename> typename CLASS=TreeNode>
struct TreeNode : public TreeNodeTemp<T, CLASS> {
private:
    using base = TreeNodeTemp<T, TreeNode>;
public:
    explicit TreeNode(T x) : base(x) {}

    size_t height{};

    ~TreeNode() override =default();
};
```
