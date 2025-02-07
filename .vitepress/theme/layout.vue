<script setup>
import { ref } from 'vue';
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
const { Layout } = DefaultTheme;
const { frontmatter, page } = useData();
console.log(frontmatter.value);
const dateStr = ref(frontmatter.value.date);
const dateInZhCN = ref(new Date(dateStr.value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
}));
const wordCount = ref(frontmatter.value.wordCount);
const readingTime = ref(Math.ceil(wordCount.value / 200));
console.log(page.value);
</script>

<template>
    <Layout>
        <template #doc-before>
            <div class="custom-component">
                <span :title="dateStr">
                    {{ dateInZhCN }}
                </span>
                &nbsp;·&nbsp;
                {{ readingTime }} min
                &nbsp;·&nbsp;
                {{ wordCount }} words
                &nbsp;·&nbsp;
                {{ frontmatter.author }}
            </div>
        </template>
    </Layout>
</template>

<style scoped>
.custom-component {
    padding: 1rem;
    border: 1px solid #eee;
    margin-bottom: 1rem;
}
</style>