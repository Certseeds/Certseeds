// prevnext.data.js
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

async function scanDirs(folders) {
    const files = new Set();
    for (const folder of folders) {
        const folderFiles = await scanDirsRec(folder)
        for (const file of folderFiles) {
            files.add(file);
        }
    }
    return Array.from(files).map(x => {
        return x.replace(/\\/g, '/');
    });
}
async function scanDirsRec(folder) {
    const files = new Set();
    if (fs.existsSync(folder)) {
        const entries = await fsp.readdir(folder, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const results = await scanDirsRec(path.join(folder, entry.name));
                for (const result of results) {
                    files.add(result);
                }
            } else if (entry.name.endsWith(".md")) {
                files.add(path.join(folder, entry.name));
            }
        }
    }
    return Array.from(files);
}

async function generateNavigationMap() {
    // 1. 获取所有markdown文件
    const files = await scanDirs([
        "./2021",
        "./2022",
        "./2023",
        "./2024",
        "./2025"
    ]);
    files.push("./README.md");
    files.push("./README.words.md");
    files.push("./LICENSE.md");
    const posts = await Promise.all(files.map(async (filePath) => {
        const contentWithMeta = await fsp.readFile(filePath, 'utf-8');
        const lines = contentWithMeta.split('\n');
        let beginTag = false;
        let endTag = false;
        const frontmatter = new Map();
        for (const line of lines) {
            if (line.startsWith('---')) {
                if (beginTag) {
                    endTag = true;
                    break;
                }
                beginTag = true;
            }
            if (line.includes(":")) {
                const [key, value] = line.split(":");
                const cleanValue = value.replace(/\"/g, '');
                frontmatter.set(key.trim(), cleanValue);
            }
        }
        const content = contentWithMeta.replace(/---[\s\S]*?---/, "");
        const engWords = (content.match(/[a-zA-Z]+/g) || []).length;
        const cnWords = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
        const numbers = (content.match(/[0-9]+/g) || []).length;
        const wordCount = engWords + cnWords + numbers;
        frontmatter.set("wordCount", wordCount);
        // console.log(frontmatter.get("title"), frontmatter.get("date"))
        return {
            url: filePath,
            path: filePath,
            frontmatter,
            title: frontmatter.get("title")?.trim() ?? "Untitled"
        };
    }));

    // 3. 按日期排序
    const sortedPosts = posts.sort((a, b) => {
        const dateA = new Date(a.frontmatter.get("date") || '1970-01-01');
        const dateB = new Date(b.frontmatter.get("date") || '1970-01-01');
        return dateB - dateA;
    });

    // 4. 构建导航Map
    const navigationMap = new Map();

    sortedPosts.forEach((post, index) => {
        const prev = index < sortedPosts.length - 1 ? {
            text: sortedPosts[index + 1].title,
            link: sortedPosts[index + 1].url
        } : {
            text: sortedPosts[0].title,
            link: sortedPosts[0].url
        };

        const next = index > 0 ? {
            text: sortedPosts[index - 1].title,
            link: sortedPosts[index - 1].url
        } : {
            text: sortedPosts[sortedPosts.length - 1].title,
            link: sortedPosts[sortedPosts.length - 1].url
        };

        navigationMap.set(post.url, {
            title: post.title,
            date: post.frontmatter.get("date"),
            wordCount: post.frontmatter.get("wordCount"),
            prev,
            next
        });
    });

    return navigationMap;
}

const data = await generateNavigationMap();
export { data };