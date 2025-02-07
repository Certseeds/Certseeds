---
author: "Certseeds"
date: "2023-06-10"
title: "优化排序算法"
description: "optimize_sorting_algorithm"
tags: ["cpp", "algorithm", "compiler"]
---

# 优化排序算法

论文链接: <https://www.nature.com/articles/s41586-023-06004-9>

LLVM pull_request链接: <https://reviews.llvm.org/D118029>

博文链接: <https://danlark.org/2022/04/20/changing-stdsort-at-googles-scale-and-beyond/>

## sort3 解析

先不用看论文, 它里面是强化学习的过程; 而是需要先观察pr到底都涉及到什么.

标题: `Introduce branchless sorting functions for sort3, sort4 and sort5.`

简介:

``` log
We are introducing branchless variants for sort3, sort4 and sort5.
These sorting functions have been generated using Reinforcement
Learning and aim to replace sort3, sort4 and __sort5 variants
for integral types.
```

简介里面出现了强化学习, 由此可见, 这个PR基本是以结果出发的.

原始的sort3如下, 模板, 宏之类的暂且不论, 只看函数体, compare都采用 `std::less<>(auto lhs,auto rhs){return lhs < rhs;}`

它的功能是把{1,2,3}的全排列给归一化成[1,2,3]

``` cpp
// code block 1
template <class _Compare, class _ForwardIterator>
_LIBCPP_CONSTEXPR_AFTER_CXX11 unsigned
__sort3(_ForwardIterator __x, _ForwardIterator __y, _ForwardIterator __z, _Compare __c)
{
    unsigned __r = 0;
    if (!__c(*__y, *__x))          // if x <= y
    {
        if (!__c(*__z, *__y))      // if y <= z
            return __r;            // x <= y && y <= z
                                   // x <= y && y > z
        swap(*__y, *__z);          // x <= z && y < z
        __r = 1;
        if (__c(*__y, *__x))       // if x > y
        {
            swap(*__x, *__y);      // x < y && y <= z
            __r = 2;
        }
        return __r;                // x <= y && y < z
    }
    if (__c(*__z, *__y))           // x > y, if y > z
    {
        swap(*__x, *__z);          // x < y && y < z
        __r = 1;
        return __r;
    }
    swap(*__x, *__y);              // x > y && y <= z
    __r = 1;                       // x < y && x <= z
    if (__c(*__z, *__y))           // if y > z
    {
        swap(*__y, *__z);          // x <= y && y < z
        __r = 2;
    }
    return __r;
}
```

sort3的情况比较方便枚举, 直接枚举一下每种场景的操作.

| 数组组成 | compare次数 | swap次数( _r) |
| :------: | :---------: | :-----------: |
| [1,2,3]  |      2      |       0       |
| [1,3,2]  |      3      |       1       |
| [2,1,3]  |      3      |       1       |
| [2,3,1]  |      3      |       2       |
| [3,2,1]  |      2      |       1       |
| [3,1,2]  |      3      |       2       |
| Average  |     8/3     |      7/6      |

优化后的__sort3

``` cpp

// Ensures that __c(*__x, *__y) is true by swapping *__x and *__y if necessary.
template <class _Compare, class _RandomAccessIterator>
inline _LIBCPP_HIDE_FROM_ABI void __cond_swap(_RandomAccessIterator __x, _RandomAccessIterator __y, _Compare __c) {
  using value_type = typename iterator_traits<_RandomAccessIterator>::value_type;
  bool __r = __c(*__x, *__y);
  value_type __tmp = __r ? *__x : *__y;
  *__y = __r ? *__y : *__x;
  *__x = __tmp;
}
// Ensures that *__x, *__y and *__z are ordered according to the comparator __c,
// under the assumption that *__y and *__z are already ordered.
template <class _Compare, class _RandomAccessIterator>
inline _LIBCPP_HIDE_FROM_ABI void __partially_sorted_swap(_RandomAccessIterator __x, _RandomAccessIterator __y,
                                                          _RandomAccessIterator __z, _Compare __c) {
  using value_type = typename iterator_traits<_RandomAccessIterator>::value_type;
  bool __r = __c(*__z, *__x);
  value_type __tmp = __r ? *__z : *__x;
  *__z = __r ? *__x : *__z;
  __r = __c(__tmp, *__y);
  *__x = __r ? *__x : *__y;
  *__y = __r ? *__y : __tmp;
}
template <class _Compare, class _RandomAccessIterator>
inline _LIBCPP_HIDE_FROM_ABI __enable_if_t<__use_branchless_sort<_Compare, _RandomAccessIterator>::value, void>
__sort3_maybe_branchless(_RandomAccessIterator __x1, _RandomAccessIterator __x2, _RandomAccessIterator __x3,  _Compare __c) {
  _VSTD::__cond_swap<_Compare>(__x2, __x3, __c);
  _VSTD::__partially_sorted_swap<_Compare>(__x1, __x2, __x3, __c);
}
template <class _Compare, class _RandomAccessIterator>
inline _LIBCPP_HIDE_FROM_ABI __enable_if_t<!__use_branchless_sort<_Compare, _RandomAccessIterator>::value, void>
__sort3_maybe_branchless(_RandomAccessIterator __x1, _RandomAccessIterator __x2, _RandomAccessIterator __x3,
                         _Compare __c) {
  _VSTD::__sort3<_Compare>(__x1, __x2, __x3, __c);
}
```

函数模板之类的不需要看, 这块看第三个函数, 用enable_if判断了可以优化之后, 调用一次`__cond_swap`,一次`__partially_sorted_swap`

`__cond_swap`一次cmp,一次swap.
`__partially_sorted_swap`内包括固定两次cmp, 三次三目表达式赋值.
swap可以认为是三次赋值, 合计起来就是三次cmp, 六次赋值.

再从过程看, 第一步会把 `[1,2,3] , [1,3,2]  [2,1,3], [2,3,1] , [3,2,1], [3,1,2]`给规约成`[1,2,3] , [1,2,3]  [2,1,3], [2,1,3] , [3,1,2], [3,1,2]`

之前的方案是8/3 次cmp, 7/6*3=3.5次赋值, 这么一看似乎比不出优势来, 我们来用在线反编译工具试一下.

注: 汇编是`command $dst $src`,有的还会更改env里面的寄存器

``` asm
// code block 1
__sort3(int*, int*, int*, std::less<int>):             # @__sort3(int*, int*, int*, std::less<int>)
        mov     r8d, dword ptr [rsi]
        mov     ecx, dword ptr [rdi]
        mov     r9d, dword ptr [rdx]
        cmp     r8d, ecx
        jge     .LBB0_1
        cmp     r9d, r8d
        jge     .LBB0_6
        mov     dword ptr [rdi], r9d
        mov     dword ptr [rdx], ecx
        mov     eax, 1
        ret
.LBB0_1:
        xor     eax, eax
        cmp     r9d, r8d
        jge     .LBB0_9
        mov     dword ptr [rsi], r9d
        mov     dword ptr [rdx], r8d
        mov     ecx, dword ptr [rsi]
        mov     edx, dword ptr [rdi]
        mov     eax, 1
        cmp     ecx, edx
        jge     .LBB0_9
        mov     dword ptr [rdi], ecx
        mov     dword ptr [rsi], edx
        jmp     .LBB0_8
.LBB0_6:
        mov     dword ptr [rdi], r8d
        mov     dword ptr [rsi], ecx
        mov     edi, dword ptr [rdx]
        mov     eax, 1
        cmp     edi, ecx
        jge     .LBB0_9
        mov     dword ptr [rsi], edi
        mov     dword ptr [rdx], ecx
.LBB0_8:
        mov     eax, 2
.LBB0_9:
        ret
// 39行汇编, 去掉声明一行, 四个jump tag,一共34行汇编.
```

原始的sort3对应的汇编可以说不堪入目, 即使注释掉_r

``` asm
// code block 1, remove value_type _r
__sort3(int*, int*, int*, std::less<int>):             # @__sort3(int*, int*, int*, std::less<int>)
        mov     ecx, dword ptr [rsi]
        mov     eax, dword ptr [rdi]
        mov     r8d, dword ptr [rdx]
        cmp     ecx, eax
        jge     .LBB0_1
        cmp     r8d, ecx
        jge     .LBB0_6
        mov     dword ptr [rdi], r8d
        jmp     .LBB0_8
.LBB0_1:
        cmp     r8d, ecx
        jge     .LBB0_9
        mov     dword ptr [rsi], r8d
        mov     dword ptr [rdx], ecx
        mov     eax, dword ptr [rsi]
        mov     ecx, dword ptr [rdi]
        cmp     eax, ecx
        jge     .LBB0_9
        mov     dword ptr [rdi], eax
        mov     dword ptr [rsi], ecx
        ret
.LBB0_6:
        mov     dword ptr [rdi], ecx
        mov     dword ptr [rsi], eax
        mov     ecx, dword ptr [rdx]
        cmp     ecx, eax
        jge     .LBB0_9
        mov     dword ptr [rsi], ecx
.LBB0_8:
        mov     dword ptr [rdx], eax
.LBB0_9:
        ret
// 33行汇编, 去掉声明一行, 四个jump tag,一共28行汇编.
```

可以看到短短几十行代码, 有五处cmp,五处jge,一处jmp.

如果用了__cond_swap优化的之后的朴素三次cond_swap

从mov里面可以读出来,

``` asm
// __cond_swap单函数
__cond_swap(int*, int*, std::__1::less<int>):   | @__cond_swap(int* x, int* y, std::__1::less<int>)
        mov     eax, dword ptr [rdi]            | 将x装入 $eax
        mov     ecx, dword ptr [rsi]            | 将y装入 $ecx
        cmp     eax, ecx                        | if $ecx >,=,< ? $eax                               // 对应 const bool __r = __c(*__x, *__y);, _r为true, x<y
        mov     edx, ecx                        | 临时寄存器$edx = ($ecx | y)                         // auto __tmp = __r ? *__x : *__y; 右半部分
        cmovl   edx, eax                        | if 上一次cmp为大于 { 临时寄存器$edx=($eax|x) }       // auto __tmp = __r ? *__x : *__y; 左半部分
        cmovg   ecx, eax                        | if 上一次cmp为小于 { $ecx = ($eax | x)}             // *__y = __r ? *__y : *__x;的右半部分
        mov     dword ptr [rsi], ecx            | 把$ecx的值装回y                                     // *__y = __r ? *__y : *__x;的左半部分
        mov     dword ptr [rdi], edx            | 把临时寄存器$eax的值装回x                            // *__x = __tmp;
        ret                                     | return
```

核心汇编是中间的六行代码, 可能会有人迷惑为什么要存 const bool,会不会有一个1bit的对象占内存? 答案是否定的, 到位的优化可以直接把这个值给分配到寄存器标志位上.

``` asm
// 连续使用三个cond_swap的sort3
__sort3_branchless(int* x, int* y, int* z, std::__1::less<int>): # @__sort3_branchless(int*, int*, int*, std::__1::less<int>)
        mov     eax, dword ptr [rsi]          | 将y装入 $eax
        mov     ecx, dword ptr [rdx]          | 将z装入 $ecx
        cmp     eax, ecx                      | if $ecx >,=,< $eax ?                               // 对应 const bool __r = __c(*__y, *__z);
        mov     r8d, ecx                      | 临时寄存器 $r8d=($ecx | z)                          // auto __tmp = __r ? *__y : *__z; 左半部分
        cmovl   r8d, eax                      | if 上一次cmp为大于 { 临时寄存器$r8d=($eax| y) }       // auto __tmp = __r ? *__y : *__z; 右半部分
        cmovl   eax, ecx                      | if 上一次cmp为大于  { $eax = ($ecx | z)}            // *__z = __r ? *__z : *__y; 如果没有本语句, 寄存器默认是右边, 走了就走左边的分支.
        mov     dword ptr [rdx], eax          | 把$ecx的值装回z                                     // *__z = __r ? *__z : *__y;的左半部分
        mov     dword ptr [rsi], r8d          | 把临时寄存器$r8d的值装回y                            // *__y = __tmp;
        // cond_swap(y,z) done
        //到此 `[1,2,3] , [1,3,2]  [2,1,3], [2,3,1] , [3,2,1], [3,1,2]`给规约成` [1,2,3], [2,1,3] , [3,1,2]`
        mov     eax, dword ptr [rdi]          | 将x装入 $eax
        mov     r8d, dword ptr [rdx]          | 将z装入 $r8d,其实没用, 等下合并掉
        cmp     eax, r8d                      | if $r8d >,=,< $eax ?                             // 对应 const bool __r = __c(*__x, *__z);
        mov     ecx, r8d                      | 临时寄存器 $ecx=($r8d | z)                        // auto __tmp = __r ? *__x : *__z; 右半部分
        cmovl   ecx, eax                      | if 上一次cmp为大于 { 临时寄存器$ecx=($eax | x) }     // auto __tmp = __r ? *__x : *__z; 左半部分
        cmovl   eax, r8d                      | if 上一次cmp为大于 { $eax = ($r8d | z)}            // *__z = __r ? *__z : *__x;如果没有本语句, 寄存器默认是右边, 走了就走左边的分支.
        mov     dword ptr [rdx], eax          | 把$ecx的值装回z                                   // *__z = __r ? *__z : *__x;的左半部分
        mov     dword ptr [rdi], ecx          | 把临时寄存器$r8d的值装回x                          // *__x = __tmp;
        // cond_swap(x,z) done
        //到此,` [1,2,3], [2,1,3] , [3,1,2]`被规约成 `[1,2,3],[2,1,3]`
        mov     eax, dword ptr [rsi]          | 将y装入 $eax, x已经在 $ecx里面了
        cmp     ecx, eax                      | cmp $eax >,=,< $r8d ?                           // 对应 const bool __r = __c(*__x, *__y);
        mov     edx, eax                      | 临时寄存器 $edx=($eax | y)                       // auto __tmp = __r ? *__x : *__y; 右半部分
        cmovl   edx, ecx                      | if 上一次cmp为大于 {临时寄存器$edx=($ecx|x)}      // auto __tmp = __r ? *__x : *__y; 左半部分
        cmovl   ecx, eax                      | if 上一次cmp为大于 { $ecx=($eax | y )}           // *__y = __r ? *__y : *__x;如果没有本语句, 寄存器默认是右边, 走了就走左边的分支.
        mov     dword ptr [rsi], ecx          | 把$ecx的值装回y                                  // *__y = __r ? *__y : *__x;的左半部分
        mov     dword ptr [rdi], edx          | 把临时寄存器$edx的值装回x                         // *__x = __tmp;
```

优化一下可得

``` asm
__sort3_branchless(int* x, int* y, int* z, std::__1::less<int>): # @__sort3_branchless(int*, int*, int*, std::__1::less<int>)
        mov     eax, dword ptr [rsi]          | 将y装入 $eax
        mov     ecx, dword ptr [rdx]          | 将z装入 $ecx
        cmp     eax, ecx                      | if $ecx >,=,< $eax ?                               // 对应 const bool __r = __c(*__y, *__z);
        mov     r8d, ecx                      | 临时寄存器 $r8d=($ecx | z)                          // auto __tmp = __r ? *__y : *__z; 左半部分
        cmovl   r8d, eax                      | if 上一次cmp为大于 { 临时寄存器$r8d=($eax| y) }       // auto __tmp = __r ? *__y : *__z; 右半部分
        cmovl   eax, ecx                      | if 上一次cmp为大于  { $eax = ($ecx | z)}            // *__z = __r ? *__z : *__y; 如果没有本语句, 寄存器默认是右边, 走了就走左边的分支.
        mov     dword ptr [rdx], eax          | 把$ecx的值装回z                                     // *__z = __r ? *__z : *__y;的左半部分
        mov     dword ptr [rsi], r8d          | 把临时寄存器$r8d的值装回y                            // *__y = __tmp;
        // cond_swap(y,z) done
        //到此 `[1,2,3] , [1,3,2]  [2,1,3], [2,3,1] , [3,2,1], [3,1,2]`给规约成` [1,2,3], [2,1,3] , [3,1,2]`
        mov     eax, dword ptr [rdi]          | 将x装入 $eax
        mov     r8d, dword ptr [rdx]          | 将z装入 $r8d
        cmp     eax, r8d                      | if $r8d >,=,< $eax ?                             // 对应 const bool __r = __c(*__x, *__z);
        mov     ecx, r8d                      | 临时寄存器 $ecx=($r8d | z)                        // auto __tmp = __r ? *__x : *__z; 右半部分
        cmovl   ecx, eax                      | if 上一次cmp为大于 { 临时寄存器$ecx=($eax | x) }     // auto __tmp = __r ? *__x : *__z; 左半部分
        cmovl   eax, r8d                      | if 上一次cmp为大于 { $eax = ($r8d | z)}            // *__z = __r ? *__z : *__x;如果没有本语句, 寄存器默认是右边, 走了就走左边的分支.
        mov     dword ptr [rdx], eax          | 把$ecx的值装回z                                   // *__z = __r ? *__z : *__x;的左半部分
        // 这里少了一步把x装回去
        // cond_swap(x,z) done
        mov     eax, dword ptr [rsi]          | 将y装入 $eax, x已经在 $ecx里面了
        cmp     ecx, eax                      | cmp $eax >,=,< $r8d ?                           // 对应 const bool __r = __c(*__x, *__y);
        mov     edx, eax                      | 临时寄存器 $edx=($eax | y)                       // auto __tmp = __r ? *__x : *__y; 右半部分
        cmovl   edx, ecx                      | if 上一次cmp为大于 {临时寄存器$edx=($ecx|x)}      // auto __tmp = __r ? *__x : *__y; 左半部分
        cmovl   ecx, eax                      | if 上一次cmp为大于 { $ecx=($eax | y )}           // *__y = __r ? *__y : *__x;如果没有本语句, 寄存器默认是右边, 走了就走左边的分支.
        mov     dword ptr [rsi], ecx          | 把$ecx的值装回y                                  // *__y = __r ? *__y : *__x;的左半部分
        mov     dword ptr [rdi], edx          | 把临时寄存器$edx的值装回x                         // *__x = __tmp;
```

这里倒不是因为什么算法的优化, 单纯是之后也没读取`[rdi]`, 这里写入没有意义.

应该是因为写法, 链接里没有这么频繁的读写内存, 重分配寄存器, 导致这里汇编和链接上的不一样.

三个cond_swap排序过程中的转化可以简单描述成:

+ `[1,2,3] , [1,3,2]  [2,1,3], [2,3,1] , [3,2,1], [3,1,2]`
+ `[1,2,3], [2,1,3] , [3,1,2]` 一步
+ `[1,2,3],[2,1,3]` 一步
+ `[1,2,3]`一步

TODO: 解析swap3的汇编代码

而优化之后, 加入了__partially_sort_swap的算法为:

+ `[1,2,3] , [1,3,2]  [2,1,3], [2,3,1] , [3,2,1], [3,1,2]`
+ `[1,2,3], [2,1,3] , [3,1,2]` 一步
+ `[1,2,3], [2,1,3],[3,1,3]` // 操作只有半步
+ `[1,2,3]` // 复用上一步的中间变量
  + 如果std::min(z,x) = `x < y`
    + 则match情况1
  + 如果std::min(z,x) = `z < y`, 不可能, 借助上一步的判断去除了一种可能性
  + 如果std::min(z,x) = x > z > y,
    + 则match情况3
  + 如果std::min(z,x) = x > y,
    + 则match情况2

  + 如果`x < y`, 这里可以用上一步的中间变量, std::min(z,x);
    直接都不用动
  + 如果std::min(z,x) > y,match情况2,3, 这里仍然可以走通.
    + x就得取y
    + 如果上一步没有操作, 这一步是`[2, 1, 3]`
      + 则y需要取x
    + 如果上一步操作成了`[3, 1, 3]`
      + 则y就得赋值成z
    + 而上一步是否操作又是因为x,z之间比大小决定的, 这里y可以直接取`std::min(x,z)`,复用变量.
    + 三种情况又被映射回了两种操作

并且由于最后一步中存在都不用动这一种选择, 优化时cmovp会有几率都不执行, 相对操作数更少.

``` diff
    将 Z 移动到 tmp 中。          |
    比较 X 和 Z。                 |
    有条件地将 X 移动到 Z 中。     |
                                 |
    有条件地将 tmp 移动到 X 中    | 有条件地将 X 移动到 tmp 中
    将 X 移动到 tmp中            | 将 tmp 移动到 X 中。                             这已被删除
    比较 X 和 Y                  |  比较 tmp 和 Y。
                                 |
    有条件地将 Y 移动到 X 中。     | 有条件地将 Y 移动到 X 中。
    有条件地将 tmp  移动到 Y 中    | 有条件地将 tmp 移动到 Y。
```

经过调整之后, 把语句对应起来是这样的. 可见其实差别在中间的语句

## conclusion

可以得出结论, D118029这个llvm的pull_request被理论上应该被分拆成两个提交:

+ 第一个提交是branchless版本的提交
  + 重点在通过cmov系列汇编指令取代cmp-and-jp, 从而创造对流水线更友好的指令.
  + 这一步就会加入对参数类型和cmp类型的模板检测, 虽然汇编行数少了, 可能也优化了指令cache的访问, 但是cmp平均调用次数和swap次数都上涨了,对复杂的cmp可能有反效果.
    + 因为复杂的cmp破坏了这个强化学习过程的假设: cmp使用一条汇编, 可以优化到用寄存器来存.
+ 第二个提交意在优化sort3,sort4,sort5:
  + 改写sort3,sort5, 加入`__partially_sorted_swap`来复用信息, 减少汇编指令.
    + sort4其实除了sort3子问题之外, 没有可以优化的.

开源项目比较倾向于one-commit-do-one-thing, 至于这个commit为什么没有这么做呢?

> LLVM review claimed to save around 2-3% for integer benchmarks but they all mostly come from the transition from branchy version to a branchless one.

come from <https://danlark.org/2022/04/20/changing-stdsort-at-googles-scale-and-beyond/comment-page-1/#comment-5356>

这样还怎么发通稿呢? deep-mind今年的头版头条指标该怎么办?

+ deepmind似乎没有透露反汇编的过程...
  + 相信llvm不希望一个asm的sort3/sort4/sort5代码块进入库, 这谁能维护得了.
    + 总不能新换一个平台就让google重新跑一次吧.
  + google工程师能否有更好的反汇编方法?

### sub-conclusion

排序可以说是最基础的问题之一, 特别是sort3这种算法, 为什么其他人没有投入时间?

+ gcc的sort算法里面就没对小序列特别优化
  + 解决问题确实需要能力, 但是这需要问题被显式的定义出来, 这可能才是最大的能力.
+ 人们倾向于认为这种小问题已经被优化完了, "低垂的果实已经被摘尽了"
  + deepmind扬唇一笑, 舌头一卷把树皮都呼噜下来了.
  + 完了, ~~小序列排序的汇编优化被做到了西历2077年, 没油水可榨了.~~
