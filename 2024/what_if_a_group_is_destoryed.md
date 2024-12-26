---
author: "Certseeds"
date: "2024-12-26"
title: "what_if_a_group_is_destoryed"
description: "如果一个群被解散?"
tags: ["frontend", "notes", "experience"]
---

# 如何重建一个群

> 直到现在还执迷于过去，真让人看不下去。
>
> ...
>
> 你这个人，满脑子都只想着自己呢
>
> Togawa Sakiko, `Bang-Dream! It's MyGO!!!!!` 18:34, 21:22

大家好啊, 今天我们来对节点网络的毁灭与重建做些分析

## 建模

假设有一个节点集群 $\{x_1, x_2, \ldots, x_n\}$, 其中每一个节点$x_n$都可以和其他节点建立双向联系, 但是节点存在一定的概率无法应答, 我们将这个无法应答概率定义为$p_{\text{fail}}$, 建立联系时无法确认, 也就是说, 当遍历所有节点时, 会有n*$p_{\text{fail}}$的节点无法应答: 既不能作为信息发出方也不能作为节点接收方. 为了避免在集群碎裂后无法重建, 我们希望每个节点随机的与其他节点建立联系, 我们将每个节点随机的与其他节点间的连接数量为$k$. 接下来点随机采样实验来模拟这个过程, 没有数学部分.

## 设计模型

``` js
/**
 * 创建节点集群（x_1, x_2, ..., x_n）
 * @param {number} n 节点数量
 * @returns {Array<object>} 返回节点对象数组
 */
const createNodes = (n) => {
    return Array.from({ length: n }, (_, i) => ({
        id: i,
        connections: new Set(),
        failed: false
    }));
};

/**
 * 随机为每个节点分配 k 个双向连接
 * @param {Array<object>} nodes 节点数组
 * @param {number} k 每个节点的连接数
 */
const randomConnect = (nodes, k) => {
    for (const node of nodes) {
        const otherNodes = nodes.filter(n => n !== node);
        // 随机洗牌
        const shuffled = structuredClone(otherNodes).sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, k);

        for (const target of selected) {
            node.connections.add(target.id);
            target.connections.add(node.id);
        }
    }
};

/**
 * 根据 p_fail 标记无法应答的节点
 * @param {Array<object>} nodes 节点数组
 * @param {number} pFail 节点无法应答的概率
 */
const markFailedNodes = (nodes, pFail) => {
    for (const node of nodes) {
        if (Math.random() < pFail) {
            node.failed = true;
        }
    }
};

const reconnectNetWork = (nodes, recDepth) => {
    const nonFailedNodes = nodes.filter(node => !node.failed);
    const startNode = nonFailedNodes[Math.floor(Math.random() * nonFailedNodes.length)];

    const bfs = (startNode, nodes, maxDepth) => {
        const queue = [{ node: startNode, depth: 0 }];
        const visited = new Set();
        visited.add(startNode.id);
        for (; queue.length > 0;) {
            const { node, depth } = queue.shift();
            if (depth >= maxDepth) { continue; }
            for (const connectionId of node.connections) {
                const connectedNode = nodes[connectionId];
                if (!connectedNode.failed && !visited.has(connectedNode.id)) {
                    visited.add(connectedNode.id);
                    queue.push({ node: connectedNode, depth: depth + 1 });
                }
            }
        }
        return visited;
    };

    const nodesAfterBFS = bfs(startNode, nodes, recDepth);

    return nodesAfterBFS;
}

const mergeSets = (sets) => {
    const setsList = [...sets];

    for (let newMerge = true; newMerge;) {
        newMerge = false;
        let newSet = new Set(setsList.shift());
        const sameList = [];
        for (let j = 0; j < setsList.length; j++) {
            const haveSame = newSet.intersection(setsList[j]);
            if (haveSame.size > 0) {
                newMerge = true;
                newSet = newSet.union(setsList[j]);
                sameList.push(j);
            }
        }
        for (const ele of sameList.reverse()) {
            setsList.splice(ele, 1);
        }
        setsList.push(newSet);
    }
    const maxNum = setsList.map(x => x.size).reduce((a, b) => Math.max(a, b), 0);
    return maxNum;
}

/**
 * 模拟节点网络
 * @param {number} n 节点数量
 * @param {number} pFail 无法应答概率
 * @param {number} k 每个节点的连接数量
 * @returns {object} 模拟结果
 */
const simulateNetwork = (n, pFail, k) => {
    // 创建节点
    const nodes = createNodes(n);

    // 随机建立连接
    randomConnect(nodes, k);

    // 标记无法应答的节点
    markFailedNodes(nodes, pFail);
    return nodes;
};

const UnitSize = 57;
const lossRate = 0.3;
const connections = 4;
const AggregationRate = 3;
const recDepth = 4;
const testTimes = 10000;
let sums = 0;
let base = 0;
for (let i = 0; i < testTimes; i++) {
    const nodes = simulateNetwork(UnitSize, lossRate, connections);
    const liveNumbers = nodes.filter(node => !node.failed).length;
    const reNetworks = [];
    for (let j = 0; j < AggregationRate; j++) {
        const reNetWork = reconnectNetWork(nodes, recDepth);
        reNetworks.push(reNetWork);
    }
    const resultSetSize = mergeSets(reNetworks);
    sums += resultSetSize;
    base += liveNumbers;
    console.log(`Average: ${sums / base}`);
}
```

简单跑一下, 一个57人群, 假设每个人有四个随机联系人, 30%的人无法应答, 有三个人发起重建, 每次重建深度为4, 大概到最后会有(0.7*88)%的人能够最后合并到一个大的群内.

## 绘图

没有js, 不想绘制.

## 结论

扩大每个人的随机联系人数量, 提高发起重建人的比率, 增强重建深度, 都应该能够提高最后的合并率, 降低无法应答比例可以有效降低完全孤立的个体出现比率, 应该也能提高合并率.
