---
author: "Certseeds"
date: "2024-07-21"
lastmod: "2024-08-01"
title: "something about firefox-extensions"
description: "有关firefox扩展的两三事"
tags: ["firefox", "frontend"]
---

# 有关firefox扩展的两三事

## 导出扩展列表

代码来自: <https://blog.lilydjwg.me/2024/7/9/firefox-addons-i-m-using-2024.216855.html>

> 来自依云's Blog

``` js
const r = $$('addon-card').map(
  (el) => {
    return {
      title: el.querySelector('h3').textContent,
      desc: el.querySelector('.addon-description').textContent,
      id: el.getAttribute('addon-id'),
    }
  }
)

let parts = [`<dl>`]
for(let ext of r) {
  parts.push(`<dt><a href="https://addons.mozilla.org/firefox/addon/${encodeURIComponent(ext.id)}/">${ext.title}</a></dt>\n<dd>${ext.desc}</dd>`)
parts.push(`</dl>`)
}

console.log(parts.join('\n')) // copilot
```

上面代码块中的代码似乎默认了页面里面有个jquery, 也许是某个extension/script注入进去的, 至少Linux端的firefox上没有, 并不能运行出什么结果来, 只有报错.

实际上看原理也是挺简单的, 启用的extensions在<about:addons>页面下是个大列表, 都在`<section class="extension-enabled-section" section="0">`下面挂着.

我们将上面的代码转写成纯javascript部分得到

``` javascript
const r = document.querySelectorAll('addon-card');
const elements = [];
for(let element of r){
  elements.push({
    title: element.querySelector('h3').textContent,
    desc: element.querySelector('.addon-description').textContent,
    id: element.getAttribute('addon-id'),
  }
  )
}
const parts = [`<dl>`];
for (let ext of elements) {
  const url = `https://addons.mozilla.org/firefox/addon/${encodeURIComponent(ext.id)}/`;
  parts.push(`<dt><a href="${url}">${ext.title}</a></dt>\n<dd>${ext.desc}</dd>`);
}
parts.push(`</dl>`);
console.log(parts.join('\n'));
```

此时会发现输出的URL类似<https://addons.mozilla.org/firefox/addon/jid1-MnnxcxisBPnSXQ%40jetpack/>, 确实可以访问, 但是缺乏可读性.

通过curl可以发现, firefox在addons市场里对addon-id那一长串做了映射, 最后访问时会转化成短URL(如果有的话), 我们可以将其转化一下.

``` bash
curl -I -L -X GET "https://addons.mozilla.org/firefox/addon/jid1-MnnxcxisBPnSXQ%40jetpack/"
HTTP/2 301
content-type: text/plain; charset=utf-8
content-length: 85
location: /en-US/firefox/addon/jid1-MnnxcxisBPnSXQ%40jetpack/
...
...
...
HTTP/2 301
content-type: text/plain; charset=utf-8
content-length: 72
location: /en-US/firefox/addon/privacy-badger17/
...
...
...
HTTP/2 200
content-type: text/html; charset=utf-8
content-length: 93068
```

使用fetch获取其更容易读取的URL.

``` javascript
const r = document.querySelectorAll('addon-card');
const elements = [];
for(let element of r){
  elements.push({
    title: element.querySelector('h3').textContent,
    desc: element.querySelector('.addon-description').textContent,
    id: element.getAttribute('addon-id'),
  }
  )
}
async function getFinalURL(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow' // 确保fetch遵循重定向
    });
    return response.url; // 获取最终URL
  } catch (error) {
    console.error('获取最终URL失败:', error);
    return url;
  }
}
async function fetchFinalURLs(elements) {
  const parts = [`<dl>`];
  for (let ext of elements) {
    const url = `https://addons.mozilla.org/firefox/addon/${encodeURIComponent(ext.id)}/`;
    const finalURL = await getFinalURL(url);
    console.log(`${url} was transferred to ${finalURL}`);
    parts.push(`<dt><a href="${finalURL}">${ext.title}</a></dt>\n<dd>${ext.desc}</dd>`);
  }
  parts.push(`</dl>`);
  console.log(parts.join('\n'));
}

// 然后调用这个异步函数
fetchFinalURLs(elements).then(() => {
  console.log('所有URL已处理完毕');
});
```

最后可以获取到类似这样, 人类可读的URL.

``` html
<dt>
    <a href="https://addons.mozilla.org/en-US/firefox/addon/privacy-badger17/">隐私獾</a>
</dt>
<dd>隐私獾会自动学习去阻止不可见的追踪器。</dd>
```

更棒的是, 当其他的都是人类可读的URL的情况下, 那些被下架的的扩展就更容易被看出来了, 其他的都是单词, 就你们是无意义字符串.

## cloudflare-数据中心

简单看下[我在访问哪个 Cloudflare® 数据中心？](https://addons.mozilla.org/en-US/firefox/addon/cf-pop/)这个是怎么做到的.

在firefox的profile/extensions目录下, 存储着addon-id.xpi格式的扩展, 找不到源代码可以直接解压打开来看. 原理很简单, cloudflare的cf-ray字段格式是`[a-z0-9]{16}-[A-Z]{3}`, 其中后面的三个大写字母是数据中心的标识, 通过这个标识可以知道请求是由哪个数据中心处理的. 然后扩展里面再放一个pop-chineseName的map, 就可以显示了.

``` js
if(header.name.toLowerCase() == 'cf-ray') {
  const ray = header.value;
  const parts = ray.split('-');
  pop = parts[parts.length-1];
  break
}
```

还以为有多动态, 没想到就是个简单的映射, 很实用, 可以直观的看页面是不是走的cf.

另外备注: 浏览器扩展跨平台应该写起来没那么麻烦, 但是得开发者来搞, 有的API是能跨, 有的不能, 得搭建环境去测试.

### cdn-pop

看这个: <https://addons.mozilla.org/en-US/firefox/addon/cdn-pop/>

是cf-pop的倍增, 加载更多的headers(代码里就这么写的, 能解包出来), 分别映射到不同的图标上, 再从header里面抽取出pop放到图标上.

缺点就是这个映射关系是需要手动维护的, 并且并不是所有的cdn都会有特定的header来鉴别, 更多的得看cname, 但是cname能力又只有firefox能提供.

cname的映射关系有个仓库: <https://github.com/u9sky/cdn-cname-domain>, 这东西自动化起来可以通过维护一个cdn自己的首页(希望他们不会堕落到用其他家的cdn代理自己主页)列表, 然后去多个ip解析cdn首页的cdn, 把相关的cname找出来分别关联上.

缺点在于大点的cdn厂商都有多个cname, 还可能不停的往外冒, 需要处理其他edge-case.

附加: 发布了扩展最好还是public下源码, 增强一下可信性(这个就不想用), 虽然能手动看, 但是这玩意能自动更新, 一次更新看一次没人能抗住.
附加二: mcont并没把它放github上, 不用看了.

## thunderbird的扩展导出

1. 指定thunderbird能够打开devtools, 在它的user.js中配置(thunderbird更新频率低, 不需要硬链接之类的操作)

``` js
user_pref("devtools.chrome.enabled", true);
user_pref("devtools.debugger.remote-enabled", true);
```

2. 打开扩展页面, Ctrl+Shift+I 打开devtools
3. 全页面搜索关键字, 找到扩展部分, 直接将`<div id="main" current-view="list">`部分复制出页面, 单独存为html.
4. 打开新文档, 调用上面的脚本, 得到一份扩展列表.
