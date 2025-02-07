---
author: "Certseeds"
date: "2021-11-21"
title: "cmake cpp pch config"
description: "how to use precompiled header in cpp"
tags: ["cpp", "compiler"]
---

# cmake中的pch预编译头加速-实际应用中的配置细节

承接上文[cmake_cpp_precompiled_header](http://blog.certseeds.com/2021/cmake_cpp_precompiled_header),项目中在实际应用一段时间的预编译头后,证明预编译头在编译中稳定性可以得到保证,加速效果较为明显,于是决定将其推广到整个项目中,并作为默认打开的选项应用. 在这个过程中,决定记录相应的应用细节

## 前情提要

### level1

预编译头文件的总头文件只有一个`INTERFACE` target,并不直接使用

``` cmake
add_library(${PROJECT_NAME}_MULTIPLY INTERFACE)
target_precompile_headers(${PROJECT_NAME}_MULTIPLY INTERFACE
                              ${CMAKE_CURRENT_SOURCE_DIR}/catch_main.hpp
                              )
```

### level2

预编译头文件的"复用target"为一个特化版本的target,private引用level1,且被level3所引用.

``` cmake
cmake_minimum_required(VERSION 3.16.6)
set(PARENT_TARGET_NAME ${PROJECT_NAME})
project(${PROJECT_NAME}_PCH17 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS}")

add_library(${PROJECT_NAME} ${LIB_WAY} ${CMAKE_CURRENT_SOURCE_DIR}/pch.cpp)

target_link_libraries(${PROJECT_NAME} PRIVATE
                      ${PARENT_TARGET_NAME}_MULTIPLY)

unset(PARENT_TARGET_NAME)
```

这一层级的主要特征是, 将一个空的pch.cpp文件作为源文件编译,并且真实编译成库

### level3

``` cmake
add_executable(${PROJECT_NAME}_${elementName}_test ${CMAKE_CURRENT_SOURCE_DIR}/${PROJECT_ORDER}_${elementName}_test.cpp)
target_precompile_headers(${PROJECT_NAME}_${elementName}_test REUSE_FROM
                        CS203_DSAA_template_INCLUDE_PCH17
                        )
```

## 遇到的问题

### 问题一

在编译过程中,日志会有大量警告报错

`${fileName} *** -fPIE [-Winvalid-pch]`提示pch与源文件所使用的构建参数不同

#### 使用相同的构建参数

确保每一个CMakeLists.txt中都有`set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS}")`,保证编译指令一样

#### 加入特定编译选项

加入`-fPIC`(大小写敏感)这个选项

### 提示 ${PREFIX}_EXPORTS not exports

这个是因为level2的target编译库类型所决定的, 由于`${LIB_WAY}`这个变量在*nix-like中为shared,所以level2的target被编译成了动态库,一般来讲将其设置为STATIC(或者OBJECT?)即可解决问题

### 提示 "not used because ${MACRO_NAME} NOT DEFINE"

这个原因来自预编译头与源文件编译选项不一致,由于在本地库中, 预编译头(独立编译,而不是随源文件一起解析宏之后再编译)为了和之前(头文件前有一个宏定义,头文件中也有应用)行为一致,通过`target_compile_definitions(${PROJECT_NAME} PRIVATE MACRO_FIRST)`显式指明加入了`MACRO_FIRST`(化名).

#### PRIVATE -> PUBLIC?

能否通过private -> public,从而让引用其的target自动获取到`MACRO_FIRST`? 答案是否定的

#### 显式指明

CMake还是不够智能,在预编译头这个target上无法自动传染宏定义,只能在每个target的定义中显式指定macro的定义.

## 最终效果

最终效果为: 编译时不再弹出有`[-Winvalid-pch]`提示的warning,编译时间变为原有60%.
