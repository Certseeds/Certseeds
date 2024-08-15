---
author: "Certseeds"
date: "2024-07-29"
lastmod: "2024-08-15"
title: "firefox-extensions list 2024"
description: "firefox扩展列表-2024"
tags: ["firefox", "frontend", "backup"]
---

# firefox extensions list

今天用之前的脚本导出一下extensions list, 发现html的dt, dd标签还有一个dl可以搭配, 搭配上之后, 页面上的k-v从上-下变成了左-右, 正好符合预期, 所以对上一个脚本做了点小修改.

顺便加了个`<code></code>`让他用等宽字体渲染,

<code>
    <dl>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/canvasblocker/">CanvasBlocker</a></dt><dd>改变某些 JavaScript API 来阻止跟踪。</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/cf-pop/">我在访问哪个 Cloudflare® 数据中心？</a></dt><dd>显示正在访问的 Cloudflare® 名称信息Main icon made by Freepik from www.flaticon.com is licensed by CC 3.0 BY</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/clearurls/">ClearURLs</a></dt><dd>从 URL 中移除跟踪元素。</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/dont-track-me-google1/">Don't track me Google</a></dt><dd>Removes the annoying link-conversion at Google Search/maps/...</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/epubreader/">EPUBReader</a></dt><dd>直接以浏览器开启epub书档</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/facebook-container/">Facebook Container</a></dt><dd>Facebook Container 将您的 Facebook 活动与其他网络活动隔离开来，以防止 Facebook 通过第三方 Cookie 在其以外的网站跟踪您。</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/feedbroreader/">Feedbro</a></dt><dd>Advanced Feed Reader - Read news & blogs or any RSS/Atom/RDF source.</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/firefox-translations/">Firefox Translations</a></dt><dd>Translate websites in your browser without using the cloud.</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/flagfox/">Flagfox</a></dt><dd>显示描述当前服务器位置的国旗。</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/font-fingerprint-defender/">Font Fingerprint Defender</a></dt><dd>Defending against Font fingerprinting by reporting a fake value.</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/happy-bonobo-disable-webrtc/">Disable WebRTC</a></dt><dd>Disables WebRTC consistently.</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/indicatetls/">IndicateTLS</a></dt><dd>在地址栏当中展示TLS版本信息。</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/localcdn-fork-of-decentraleyes/">LocalCDN</a></dt><dd>通过将请求重定向到本地资源，以保护你免于 CDN（内容分发网络）的跟踪。</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/multi-account-containers/">Firefox Multi-Account Containers</a></dt><dd>Multi-Account Containers 可让您临时或永久地以指定身份打开生活中的网站（小号多开）。名称和颜色皆可自定义，助您分门别类地管理各种活动 — 网络购物、旅行规化、收发工作邮件等等。</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/osmos-memo/">osmos::memo</a></dt><dd>An in-browser bookmark manager with easy tagging and fast recall</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/port-authority/">Port Authority</a></dt><dd>Blocks websites from using javascript to port scan your computer/network and dynamically blocks all LexisNexis endpoints from running their invasive data collection scripts. </dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/privacy-badger17/">隐私獾</a></dt><dd>隐私獾会自动学习去阻止不可见的追踪器。</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/redirector/">Redirector</a></dt><dd>Automatically redirect content based on user-defined rules.</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/rsshub-radar/">RSSHub Radar</a></dt><dd>轻松查找和订阅 RSS 和 RSSHub。</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/simple-translate/">Simple Translate</a></dt><dd>在网页上快速翻译选定或输入的文本。支持 Google 翻译和DeepL API。</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/support%40z-lib.se/">Z-Library Finder</a></dt><dd>Access Z-Library in just one click. Our extension will redirect you to an available library website in seconds.</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/switchyomega/">Proxy SwitchyOmega</a></dt><dd>轻松快捷地管理和切换多个代理设置。</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/traduzir-paginas-web/">TWP - Translate Web Pages</a></dt><dd>使用 Google 或 Yandex 实时翻译您的页面。</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/uBlock0%40raymondhill.net/">uBlock Origin</a></dt><dd>一款高效的网络请求过滤工具，占用极低的内存和 CPU。</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/url-to-qrcode/">URL to QR code</a></dt><dd>Converts the tab URL to QR code.</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/">暴力猴</a></dt><dd>一个开源的用户脚本管理器，支持很多浏览器</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/webgl-fingerprint-defender/">WebGL Fingerprint Defender</a></dt><dd>Defending against WebGL fingerprinting by reporting a fake value.</dd>
    </dl>
    <div><a>------分割线, 下面是停用的-----</a></div>
    <dl>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/%7B94249bf3-29a3-4bb5-aa30-013883e8f2f4%7D/">Canvas Fingerprint Defender</a></dt><dd>Defending against Canvas fingerprinting by reporting a fake value.</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/%7Bab0ae774-f22f-479b-9b1b-6aff11bf6f5c%7D/">AudioContext Fingerprint Defender</a></dt><dd>Defending against AudioContext fingerprinting by reporting a fake value.</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/braavos-wallet/">Braavos</a></dt><dd>适用于 Starknet 的 Braavos 智能钱包可以轻松管理您的资产并从您的浏览器安全地访问去中心化应用程序。</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/cdn-pop/">CDN POP</a></dt><dd>Adds a badge that shows which CDN and CDN POP the current page is being loaded from.</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/decentraleyes/">Decentraleyes</a></dt><dd>保护您免受集中式的内容交付网络（CDN）的跟踪。</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/foxyproxy-standard/">FoxyProxy</a></dt><dd>易于使用，适用于任何人的高级代理管理工具</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/to-google-translate/">To Google Translate 谷歌快译</a></dt><dd>选中文本，用谷歌翻译或收听发音。</dd>
        <dt><a href="https://addons.mozilla.org/en-US/firefox/addon/user-agent-string-switcher/">User-Agent Switcher and Manager</a></dt><dd>Spoof websites trying to gather information about your web navigation to deliver distinct content you may not want </dd>
    </dl>
</code>

大部分都不需要什么配置, 打开就能用.

年内的更新会在这个文档内, 跨年的更新就在新文档内, 方便做对比.
