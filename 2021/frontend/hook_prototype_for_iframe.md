---
author: "Certseeds"
date: "2021-10-30"
title: "hook prototype for iframe"
description:  "hook prototype for iframe"
tags: ["frontend", "security"]
---

# 通过prototype来禁止动态iframe进行攻击

## 简要介绍

承接上文[service_worker and iframe](http://certseeds.github.io/Certseeds/posts/2021/frontend/service_worker_and_iframe), 新的网站内有三种,两大类措施很难防御,今天来介绍如何对抗其中的iframe

经过简单分析后,可得关键函数

``` typescript
function getUAs() {
    const frame = document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-same-origin"),
        frame.src = "javascript:false",
        frame.classList.add("hidden"),
        document.body.appendChild(frame);
    const { userAgent: userAgent, appVersion: appVersion } = frame.contentWindow.navigator;
    return frame.remove(),
        [navigator.userAgent, _navigator.userAgent, "Mozilla/" + _navigator.appVersion, headerUA, userAgent, "Mozilla/" + appVersion]
}
```

思路很简单清晰, 创建一个`iframe`,添加必要的属性,添加进入document内,之后即可从中的contentWindow的navigator中获取信息.

### 思路一: Hook createElement

这个不太行得通,为什么?

#### 有反制措施

``` typescript
for (var keys = ["createElement"], i = 0; i < keys.length; i++) {
    (cond = void 0 !== Object.getOwnPropertyDescriptor(document, keys[i])) && window.ntgrtchcks.push(300),
        (descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(document), keys[i])) && (descriptor.writable && window.ntgrtchcks.push(300),
            descriptor.get && -1 === descriptor.get.toString().indexOf("[native code]") && window.ntgrtchcks.push(300))
}
for (keys = ["vendor", "plugins", "platform", "languages", "webdriver", "mimeTypes", "deviceMemory", "hardwareConcurrency"],
    i = 0; i < keys.length; i++) {
    (cond = void 0 !== Object.getOwnPropertyDescriptor(navigator, keys[i])) && window.ntgrtchcks.push(301),
        (descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(navigator), keys[i])) && (descriptor.writable && window.ntgrtchcks.push(301),
            descriptor.get && -1 === descriptor.get.toString().indexOf("[native code]") && window.ntgrtchcks.push(301))
}
for (keys = ["width", "height", "availTop", "availLeft", "availWidth", "availHeight", "colorDepth", "pixelDepth", "orientation"],
    i = 0; i < keys.length; i++) {
    (cond = void 0 !== Object.getOwnPropertyDescriptor(screen, keys[i])) && window.ntgrtchcks.push(302),
        (descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(screen), keys[i])) && (descriptor.writable && window.ntgrtchcks.push(302),
            descriptor.get && -1 === descriptor.get.toString().indexOf("[native code]") && window.ntgrtchcks.push(302))
}
```

由于这个思路太直接,所以可以看到,网页中已经有了反制的方式

#### navigator不是这个时候创建的

navigator在createElement的时候还不存在,appendChild之后才存在

### 思路二: hook appendChild

#### 问题一: 如何 Hook appendChild?

appendChild对所有Node类的Object都存在,不是简单能通过遍历赋值的方式,需要寻找一种更便捷的方式.

虽然js中没有class概念,但是有相似的prototype概念,像`document.body`,`document.head`这类Object的prototype都是`Node`, 因此可以对Node的prototype下手

``` typescript
// 暂存prototype
const NodePrototype = Node.prototype
// 保存之前的function
const nodeAppendChild = NodePrototype.appendChild
// 设置代理
const nodePrototypeAppendChild = new Proxy(nodeAppendChild, handler_of_getter)
```

此处的handler_of_getter是一个对象,其apply参数是一个代理函数

``` typescript
const handler_of_getter = {
    apply: (target, thisArg: object, args: object) => {
      const result: HTMLElement = target.apply(thisArg, args)
      if (result?.tagName?.toUpperCase() === 'IFRAME') {
        const iframe = result as HTMLIFrameElement, contentWindow = iframe.contentWindow
        if (typeof contentWindow === 'object' && contentWindow !== null) {
          patchNavigator(contentWindow.navigator)
        }
      }
      return result
    }
  }
```

代理函数中用到了`Random-User-Agent`的预制函数`patchNavigator`

最后设置代理

``` typescript
const factoryAttributesDefineProperty = (proxy: object) => {
    return {
     get: () => {
       return proxy
     }
   }
}
Object.defineProperty(NodePrototype, "appendChild", factoryAttributesDefineProperty(nodePrototypeAppendChild))
```

#### 问题二: 还有没有其他的要hook?

答案是有,还不止一个,还有`Node.insertBefore`,`Element.append`

因此代码需要变成

``` typescript
const handler_of_getter = {
    apply: (target, thisArg: object, args: object) => {
      const result: HTMLElement = target.apply(thisArg, args)
      if (result?.tagName?.toUpperCase() === 'IFRAME') {
        const iframe = result as HTMLIFrameElement, contentWindow = iframe.contentWindow
        if (typeof contentWindow === 'object' && contentWindow !== null) {
          patchNavigator(contentWindow.navigator)
        }
      }
      return result
    }
  }
  const handler_of_operator = {
    apply: (target, thisArg: object, args: object) => {
      target.apply(thisArg, args)
      patchDynamicIframeElementsContentWindow()
    }
  }
  const NodePrototype = Node.prototype,elementPrototype = Element.prototype
  const nodeAppendChild = NodePrototype.appendChild,
      nodeInsertBefore = NodePrototype.insertBefore,
      elementAppend = elementPrototype.append
  const nodePrototypeAppendChild = new Proxy(nodeAppendChild, handler_of_getter),
      nodePrototypeInsertBefore = new Proxy(nodeInsertBefore, handler_of_getter),
      elementPrototypeAppend = new Proxy(elementAppend,handler_of_operator)
  const factoryAttributesDefineProperty = (proxy: object) => {
       return {
        get: () => {
          return proxy
        }
      }
  }
  Object.defineProperty(NodePrototype, "appendChild", factoryAttributesDefineProperty(nodePrototypeAppendChild))
  Object.defineProperty(NodePrototype, "insertBefore", factoryAttributesDefineProperty(nodePrototypeInsertBefore))
  Object.defineProperty(elementPrototype, "append", factoryAttributesDefineProperty(elementPrototypeAppend))
```

#### 代理函数报错

这里仍然会有点问题,其实appendChild这几个函数也是有可能被继续hook的-不过一般都不是网站的自发行为,进行操作的一般是第三方脚本.

因此代理工厂函数应该改为如下

``` typescript
const factoryAttributesDefineProperty = (proxy: object) => {
    return {
     get: () => {
       return proxy
     },
     set: () => {
       return () => {} // just prevent to throw err while runtime
     }
   }
}
```

此时,将所有修改填入content-script.ts内, 完成对iframe的防御