---
meta: true
title: archive page
date: "2025-02-01"
summary: the root page of blog
description: the root page of blog
publish: false
---

<div>
  <h3>Hi there 👋; Welcome to my blog</h3>
</div>

# All Blog Posts

<script setup>
import {ref, computed} from "vue";
import { data } from '.vitepress/posts.data.js';

const posts = ref([]);
const originalPosts = ref(data);
posts.value = data;
console.log(posts.value.length);
console.log("hello world");
const tagsMap = new Map();
for(const post of posts.value) {
    const tags = post.frontmatter?.tags ?? [];
    for(const tag of tags) {
        if(tagsMap.has(tag)){
            const urlSet =tagsMap.get(tag);
            urlSet.add(post);
        } else {
            const urlSet = new Set();
            urlSet.add(post);
            tagsMap.set(tag, urlSet);
        }
    }
}
console.log(tagsMap.keys());
const chooseTags = ref(new Set());
const sortedTags = computed(() => {
    return [...tagsMap.keys()].sort((a, b) => {
        const sizeA = tagsMap.get(a).size;
        const sizeB = tagsMap.get(b).size;
        return sizeB - sizeA; // 降序排序，文章数量多的标签排在前面
    });
});
const filteredPosts = computed(() => {
    if (chooseTags.value.size === 0) {
        return originalPosts.value;
    }
    let result = new Set(originalPosts.value);
    for (const tag of chooseTags.value) {
        const postsWithTag = tagsMap.get(tag);
        result = result.intersection(postsWithTag);
    }
    return Array.from(result);
});

const toggleTag = (tag) => {
    if (chooseTags.value.has(tag)) {
        chooseTags.value.delete(tag);
    } else {
        chooseTags.value.add(tag);
    }
    posts.value = filteredPosts.value;
};
const scrollToBottom = () => {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: 'smooth'
  });
};
</script>

## posts部分

<div class="posts-list">
  <article v-for="(post, index) in posts"
           :key="index"
           class="post-entry">
    <header class="entry-header">
      <div class="vp-raw">
        <h2 class="entry-hint-parent">
          {{ post.frontmatter.title }}
        </h2>
        <h3>
          {{ post.frontmatter.description}}
        </h3>
      </div>
    </header>
    <div class="entry-content">
      <p>{{ post.frontmatter.preContent }}</p>
    </div>
    <footer class="entry-footer">
      <span :title="post.frontmatter.date">
        {{ new Date(post.frontmatter.date).toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) }}
      </span>
      &nbsp;·&nbsp;
      {{ post.frontmatter.readingTime }} min
      &nbsp;·&nbsp;
      {{ post.frontmatter.wordCount }} words
      &nbsp;·&nbsp;
      {{ post.frontmatter.author }}
    </footer>
    <div class="entry-tags" v-if="post.frontmatter.tags && post.frontmatter.tags.length">
      <span v-for="(tag, index) of post.frontmatter.tags" :key="tag" class="tag">
        {{ tag }}
      </span>
    </div>
    <a class="entry-link" :aria-label="'post link to ' + post.frontmatter.title"
    :href="post.url">
    </a>
  </article>
</div>

## tags

<div class="tags-filter">
    <span v-for="tag in sortedTags"
          :key="tag"
          :class="['filter-tag', {'selected': chooseTags.has(tag)}]"
          @click="toggleTag(tag)">
        {{ tag }} {{ tagsMap.get(tag).size }}篇
    </span>
</div>

<style>
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-entry {
  position: relative;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
  transition: transform 0.2s;
}

.post-entry:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.entry-header h2 {
  margin: 0 0 0.5rem;
  font-size: 1.4rem;
}

.entry-header h3 {
  margin-top: 0.5rem;     /* 减少h3的顶部间距 */
  margin-bottom: 1.5rem;  /* 增加h3的底部间距 */
  color: #666666;            /* 使描述文字颜色更浅，与标题形成层次 */
  font-weight: normal;    /* 降低字重，进一步区分层级 */
}

.entry-content {
  margin-top: 1rem;      /* 增加内容区域的顶部间距 */
}

.entry-content p {
  margin: 0;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.entry-footer {
  margin-top: 1rem;
  color: #999;
  font-size: 0.9rem;
}

.entry-link {
  position: absolute;
  inset: 0;
  z-index: 1;
}
.entry-tags {
  margin-top: 0.5rem;
}
.tag {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  margin: 0.2rem;
  border-radius: 4px;
  background-color: #f0f0f0;
  color: #666;
  font-size: 0.8rem;
}

.tag:hover {
  background-color: #e0e0e0;
}
.tags-filter {
    margin: 1rem 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.filter-tag {
    padding: 0.3rem 0.8rem;
    border-radius: 1rem;
    background: #f0f0f0;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
}

.filter-tag:hover {
    background: #e0e0e0;
}

.filter-tag.selected {
    background: #4a9eff;
    color: white;
}
</style>
