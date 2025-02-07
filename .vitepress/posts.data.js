import { createContentLoader } from 'vitepress'

const getTime = (post) => {
    const frontmatter = post?.frontmatter ?? "1970-01-01";
    const date = frontmatter.date;
    const top = frontmatter?.top ?? false;
    if (top) {
        return new Date('2777-12-31').getTime();
    }
    return new Date(date).getTime();
}

export default createContentLoader(
    ['20*/**/*.md',
        'README.md',
        'README.words.md',
        'LICENSE.md'
    ],
    {
        includeSrc: true,
        transform(posts) {
            // 根据需要对原始数据进行 map、sort 或 filter
            // 最终的结果是将发送给客户端的内容
            const sortArray = posts
                .filter(post => (post.frontmatter?.meta ?? false) === false)
                .sort((a, b) => {
                    const dateA = getTime(a);
                    const dateB = getTime(b);
                    return dateB - dateA;
                })
            const result = sortArray
                .map(post => {
                    const contentWithMeta = post.src;
                    const content = contentWithMeta.replace(/---[\s\S]*?---/, "");
                    const engWords = (content.match(/[a-zA-Z]+/g) || []).length;
                    const cnWords = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
                    const numbers = (content.match(/[0-9]+/g) || []).length;
                    const wordCount = engWords + cnWords + numbers;
                    const readingTime = Math.ceil(wordCount / 200);
                    const preContent = content.slice(0, 144);
                    post.frontmatter.wordCount = wordCount;
                    post.frontmatter.readingTime = readingTime;
                    post.frontmatter.preContent = preContent;
                    post.frontmatter.title = post.frontmatter?.title ?? "untitled";
                    post.frontmatter.author = post.frontmatter?.author ?? "Certseeds";
                    return {
                        frontmatter: post.frontmatter,
                        url: post.url,
                    }
                });
            return result;
        }
    }
)