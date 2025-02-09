<script setup>
import { ref, watchEffect } from 'vue';
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
const { Layout } = DefaultTheme;
const { frontmatter} = useData();
// console.log(frontmatter.value);
const dateStr = ref('');
const dateInZhCN = ref('');
const wordCount = ref(0);
const readingTime = ref(0);

watchEffect(() => {
    dateStr.value = frontmatter.value.date;
    dateInZhCN.value = new Date(frontmatter.value.date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    wordCount.value = frontmatter.value.wordCount;
    readingTime.value = Math.ceil(wordCount.value / 200);
});
// console.log(page.value);
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