import { defineConfig } from 'vitepress'
import mdFootnote from "markdown-it-footnote"

import { RSSOptions, RssPlugin } from 'vitepress-plugin-rss'
import { data } from './prevnext.data.js';

const language = "zh-CN";
const author = 'Certseeds';
const title = `${author} Blog`;
const hostURL = 'https://blog.certseeds.com';
const image = "https://avatars.githubusercontent.com/u/51754303";
const copyright = `2021-${new Date().getFullYear()} ${author} publish this document based on CC BY-NC-SA 4.0(or any later version)`;
const RSS: RSSOptions = {
    title: title,
    baseUrl: hostURL,
    copyright: copyright,
    language: language,
    description: `Recent content on ${author} Blog`,
    filename: "index.xml",
}
const prevnextMap = data;
console.log("prevnextMap", prevnextMap.size);

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: title,
    description: title,
    vite: {
        plugins: [RssPlugin(RSS)]
    },
    themeConfig: {
        nav: [
            { text: 'Home', link: '/' }
            , { text: "encryptMsg", link: 'https://openpgpage.certseeds.com' }
        ],
        socialLinks: [
            { icon: 'github', link: 'https://github.com/Certseeds/Certseeds' }
        ],
        footer: {
            copyright: copyright
        },
        lastUpdated: {
            formatOptions: {
                era: "short",
                year: "numeric",
                month: "long",
                weekday: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                hour12: false,
                timeZone: "UTC",
                timeZoneName: "longGeneric",
                fractionalSecondDigits: 3,
                formatMatcher: "basic",
            },
        },
        search: {
            provider: 'local'
        }
    },
    head: [
        ['meta', { property: 'og:type', content: 'website' }],
        ['meta', { property: 'og:locale', content: language }],
        ['meta', { property: 'og:title', content: title }],
        ['meta', { property: 'og:site_name', content: title }],
        ['meta', { property: 'og:image', content: image }],
        ['meta', { property: 'og:url', content: hostURL }],
        ['meta', { property: 'twitter:card', content: 'summary_large_image' }],
        ['meta', { property: 'twitter:title', content: title }],
        ['meta', { property: 'twitter:image', content: image }],
        ['meta', { property: 'twitter:description', content: title }],
        ['meta', { property: 'keywords', content: 'vitepress, nodejs, blog' }],
        ['meta', { property: 'robots', content: 'index, follow' }],
        ['meta', { property: 'author', content: `${author}` }],
    ],
    markdown: {
        config: (md) => {
            md.use(mdFootnote);
        },
        math: true
    },
    sitemap: {
        hostname: hostURL,
        transformItems: (items) => {
            // 添加新项目或修改/筛选现有选项
            items.push({
                url: '/huge.gz',
                lastmod: `${new Date().toISOString()}`,
            })
            return items
        }
    },
    lastUpdated: true,
    metaChunk: true,
    transformPageData(pageData) {
        console.log("transformPageData called for:", pageData.relativePath);
        const prevnext = prevnextMap.get(pageData.relativePath);
        if (prevnext !== undefined) {
            pageData.frontmatter.prev = prevnext.prev;
            pageData.frontmatter.next = prevnext.next;
            pageData.frontmatter.wordCount = prevnext.wordCount;
        }
    }
})
