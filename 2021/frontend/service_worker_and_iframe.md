---
author: "Certseeds"
date: "2021-10-23"
title: "service worker and iframe"
description: "service worker and iframe"
tags: ["frontend", "security", "privacy"]
---

# service_worker and iframe in Modern Broswer

承接上文 [./how_to_confront_with_track.md](http://blog.certseeds.com/posts/2021/how_to_confront_with_track), 我们已经知道了 User-Agent是一个信息熵极高的HTTP-Header字段, 并介绍了几种对抗方式.

最近发现了一个网站,能够探查User-Agent, 在这个网站上看到了一些全新的东西. [webBroswerTools](https://webbrowsertools.com/useragent/)

## 网站的探查分析

|                  Method                  |                                                                User-Agent                                                                |
| :--------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------: |
|       [normal] navigator.userAgent       |         Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.91 Safari/537.36         |
|     [aggressive] navigator.userAgent     |            Mozilla/5.0 (Macintosh; Intel Mac OS X 11_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Safari/605.1.15            |
|    [aggressive] navigator.appVersion     |            Mozilla/5.0 (Macintosh; Intel Mac OS X 11_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Safari/605.1.15            |
|          [aggressive] UA Header          |                                                                    空                                                                    |
| [aggressive] iframe navigator.userAgent  | Mozilla/5.0 (Windows NT ____; Win__; x__) AppleWebKit/${number} (KHTML, like Gecko) Chrome/${version} Safari//${version} Edge/${version} |
| [aggressive] iframe navigator.appVersion | Mozilla/5.0 (Windows NT ____; Win__; x__) AppleWebKit/${number} (KHTML, like Gecko) Chrome/${version} Safari//${version} Edge/${version} |

可以看到, 网站上一共提供了六种探查方式

第一种,最naive,直接在运行时获取, `Random User-Agent`可以通过在页面加载时注入JS代码并执行来轻易篡改navigator的属性, 因此可以被轻易的hook.

第二种, 在页面渲染时clone一个navigator对象, 从而防止被篡改. 这个也好说,只要`User Switcher and Manager`的速度够快,就能在渲染前注入属性, 从而攻击值.

第三种, 使用"appVersion"而非User-Agent属性,由于形式上不变, 方法如上,也可以解决掉.

第四种, 此时开始棘手了, 页面使用了名叫 `Service Worker`的技术: 简单地讲, 在页面上注册了一个拦截器,可以拦截服务器的请求,并将之返回; 通常情况下,即使本地读取到了User-Agent字段,发送出去的Http报文也是先被`Random User-Agent`这一类拦截器所拦截的, 但是这里收下不知道为什么获取到了真实UA,并且`Service Worker`可以做到更早的拦截,于是可以从`${URL}request.header.get('User-Agent')`中获取到UA,并返回,通知主页面.

注: 使用的代码如下:

``` javascript
// https://webbrowsertools.com/useragent/worker.js
// Become available to all pages
self.addEventListener('install', e => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('fetch', e => {
  const a = new URL(e.request.url);
  if (a.origin === location.origin && a.href.endsWith('/echo/ua')) {
    e.respondWith(new Response(e.request.headers.get('user-agent')));
  }
});
```

1. 如果能够hook真实的UA,便可以解决问题.
2. 如果能调整拦截优先级,令`Mod HTTP Headers`可以拦截该请求的话,也能把问题解决掉
3. 最后的解决办法: 用`Block Service Workers`,一刀切禁止所有`Service Worker`,只要没有本地server,拦截就不是问题了.

第五/六种: 在Iframe中执行操作三,操作四,

由于几乎所有注入代码的脚本都是在当前界面执行的,所以Iframe这个 独立于当前界面的navigator就变成了一个富矿, 只要在这里执行脚本就可以获取到真实情况.

`Iframe`本身独立性非常好, 并且可以由js拼接执行后销毁, 无法被`No Script`等 直接在加载时禁止掉,可以说是非常难攻击了.

## 更加底层的思考

除去这些依赖浏览器环境的前端攻击方式, 实际上,现代浏览器chrome与firefox关于User-Agent方面的代码都是开源的, 比如Chromium涉及到User-Agent的代码

[local_dom_window](https://github.com/chromium/chromium/blob/72ceeed2ebcd505b8d8205ed7354e862b871995e/third_party/blink/renderer/core/frame/local_dom_window.cc) [user_agent](https://github.com/chromium/chromium/blob/72ceeed2ebcd505b8d8205ed7354e862b871995e/content/common/user_agent.cc)

如果我们能够直接修改底层代码, 随后进行重编译,替换现有浏览器中的组件,可以直接从底层进行"攻击",在进一步讲,如果C++层将一些动态的方法提供给上层js,甚至有可能实现js控制原生,在不同场景下显示出不同的"navigator".

此处就显示出 Chromium系和Firefox系的不同之处了, Chromium虽然也是开源,但是将代码放在一个巨大仓库中,同时使用一种 严重依赖网络的依赖安装方法,配合它们巨大的资源依赖量,使得编译Chromium消耗网速,消耗流量,消耗编译时间,甚至会花费几十G硬盘乃至内存. 而FireFox在普通家用机(8C16T32G)上,不到一个小时就可以编译成功. 这编译速度上的不同就将修改两者的门槛大大的拉大了.

当然,凡事要往好处想, 为什么CNZZ,Automattic要动用数百种(Edge统计的, Ghostry则分析出2000左右个)追踪器,为什么会有WebGL,字体指纹识别等奇技淫巧,归根结底还是要让人**看 广 告**, 只要不看广告,问题就解决了!

PS1: 以上所有探查方法都依赖于Javascript,禁掉JS执行可以解决绝大部分问题(同时也解决掉了网页的正常访问)
PS2: 经过实验, IE由于对JS兼容性不好,居然能躲过4,5还有6
PS3: 也许Chrome的`--user-agnet ${UA}`启动参数有效
