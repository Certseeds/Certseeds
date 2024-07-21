---
author: "Certseeds"
date: "2024-07-21"
title: "unlimited_blog"
description: "不受攻击影响的博客"
tags: ["blog", "cloudflare"]
---

# 不受攻击影响的博客

最近看完博文 <https://www.54yt.net/435.html>之后, 听闻该博客被攻击了, 恶意攻击者刷了几亿次访问, 将该博客短时间内打到了欠费, 因此联想到了本博客如果发生这种事件, 应该如何应对.

## 流量限制

单从页面上看, <https://www.54yt.net>用了国内的CDN, 有ICP许可证, 因此攻击方一边发律师函一边DDOS页面以及静态资源是有效的, 个人博客不可能有无限的流量, 打到一定限度欠费了就能停止它的传播.

github pages有没有流量限制? 答案是肯定的

> GitHub Pages sites have a soft bandwidth limit of 100 GB per month.

referer from <https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages>

恶意攻击方只要刷个100GB就可以啦, 考虑到构建好的全站大概6MB, hugo还提供了全站的sitemap, 只要攻击方访问站点几万次就能耗干流量了.

因此考虑在cloudflare搭建镜像站, 虽然<https://developers.cloudflare.com/pages/platform/limits/>没有提及, 但是<https://www.cloudflare.com/plans/developer-platform/>上写明了'无限请求数'以及'无限带宽', 这下不用担心被打爆了.

我们使用cloudflare提供的actions打包上传, 在pages的env里面添加一些环境变量

+ CLOUDFLARE_API_TOKEN
+ CLOUDFLARE_ACCOUNT_ID
+ CLOUDFLARE_PROJECT_NAME

这里需要注意, actions需要显式声明使用到的env, `environment: github-pages`

之后给cf-pages修改一下URL, 构建一把

``` yaml
      - name: Publish to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: ${{ vars.CLOUDFLARE_PROJECT_NAME }}
          directory: ./cf-public
          branch: main
```

注意看, 无论是apiToken还是accountId感觉都不应该泄露, projectName倒是无所谓, URL里面就体现了.

branch必须得填, 手动上传文件方式创建的page, 默认的部署在没有其他生产部署环境的情况下, 没法删除掉第0步创建时上传的构建文件.

备注: 默认分支不是不能改, 是只能用下面的脚本来改, 有点恶意的.

``` bash
curl --request PATCH \
    "https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project_name}" \
    --header "Authorization: Bearer <API_TOKEN>" \
    --header "Content-Type: application/json" \
    --data "{\"production_branch\": \"main\"}"
```

## 自定义域名

没想到这一步非常简单, 输入自定义域, 点击确认, 结束.

+ cf-pages域名: <https://certseeds-blog.pages.dev>
+ 自定义域名: <https://cfblog.certseeds.com>
