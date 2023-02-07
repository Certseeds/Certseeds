---
author: "Certseeds"
date: "2022-02-03"
title: "简评cache算法"
description: "talking about cache-algorithm"
tags: ["cpp", "cache"]
---

# 简评cache算法

## background

整理代码时发现了之前写的cache代码, 稍加整理之后正适合简要分析一下

首先定义问题, 假设存在一个片上cache,CPU对其存在两种操作, 第一种是测试一个内存页($x$)在不在cache上,返回boolean(true代表在,也可以认为是测试读取, 只不过由于内存页一页其实非常大, 返回具体的值不太好实现,不如这么操作), 第二种是要求cache读取新的内存页($y$),返回boolean(true代表内存页在cache上).

而cache只存在一个属性-缓存大小,按照上面的描述写出基类代码

``` cpp
class cache_base : protected nonCopyMoveAble {
protected:
    const size_t cache_size;
public:
    explicit cache_base(size_t x = 0) : cache_size(x) {};

    virtual bool exists(size_t value) const = 0;

    virtual bool read(size_t value) = 0;

    virtual ~cache_base() = default;
};
```

## 实现

### 最简单的实践: no-cache

最简单的实现是容量默认为0, 无法容纳任何内存页---所有内存页都不在cache上, 要求读取新的内存页永远发现不在已有的内存页中,永远需要读取. 唯一的好处是, 实现代码非常简洁, 并且时间空间复杂度都是O(1)

``` cpp
class no_cache final : private cache_base {
public:
    explicit no_cache(size_t) : cache_base(0) {}

    bool exists(size_t) const override { return false; }

    bool read(size_t) override { return false; }
};
```

### 先入先出 FIFO

#### FIFO-O(n)

比较朴素的思想, 内部保存一个队列, 通过`std::find`寻找对象, 要插入新内存页时, 排除最先进入队列的元素,将元素插入.

时间复杂度: `exists:O(n)`,`read:O(n)`(被exists拖累了)

``` cpp
namespace On {
class fifo_cache final : private cache_base {
private:
    std::list<size_t> que;
public:
    explicit fifo_cache(size_t size) : cache_base(size) {}

    bool exists(size_t page) const override {
        return std::find(que.begin(), que.end(), page) != std::end(que);
    }

    bool read(size_t page) override {
        if (this->exists(page)) {
            return true;
        } else {
            if (que.size() == cache_size) {
                que.pop_front();
            }
            que.push_back(page);
            return false;
        }
    }
};
}
```

#### FIFO-O(1)

可以看到,其实上面的主要时间复杂度在exists上面, 因此, 对此进行优化的话,可以使用一个哈希表存储所有元素, 从而提供O(1)的exists,从而实现O(1)的read

时间复杂度: `exists:O(1)`,`read:O(1)`

``` cpp
namespace O1 {
class fifo_cache final : private cache_base {
private:
    std::queue<size_t, std::list<size_t>> que;
    std::unordered_set<size_t> uset;
public:
    explicit fifo_cache(size_t size) : cache_base(size) {}

    bool exists(size_t page) const override {
        return uset.count(page) != 0;
    }

    bool read(size_t page) override {
        if (this->exists(page)) {
            // the problem is that, nothing to do when cache hit
            return true;
        } else {
            if (que.size() == cache_size) {
                const auto last{que.front()};
                uset.erase(last);
                que.pop();
            }
            que.push(page);
            uset.insert(page);
            return false;
        }
    }
};
```

由于这里不再对`this->que`使用`std::find`,因此采用std::list的包装类std::queue,略微简化操作.

#### FIFO-conclusion

FIFO的实现可以在O(1)内实现,并且比较简单,非常方便理解.

很明显, read中判断命中后,完全没有任何操作,因此浪费了一定的信息量, 这个算法还远远称不上好用.

### ReadBit-FIFO-Second Chance

从FIFO的命中后没有操作说起, 可以考虑将"写入cache后有没有读取过"作为一个维度, 很明显, 根据局部性, 被读取过的元素,其被再次读取的可能性比没有读取过的要高.

最简单的实现是加入一个Read位, 在FIFO的基础上, 加入内存页时置为false,被读取过之后置为false; 一旦需要抛弃内存页中最老旧项时, 如果Read位为true则重新加入队列, 直到读取到false为止.

这个算法存在一个缺陷: 虽然平均均摊复杂度没有太大变化,但是存在调用之间的时间分布不平衡, 最坏情况下一次Read操作可能会把整个cache全部倒腾一边,全部置为false.

#### FIFO-Second Chance O(n)

时间复杂度: `exists:O(n)`,`read:O(n)`

``` cpp
namespace On {
class fifo_sc_cache final : private cache_base {
private:
    std::list<std::pair<size_t, bool>> que;
public:
    explicit fifo_sc_cache(size_t size) : cache_base(size) {}

    bool exists(size_t page) const override {
        return std::find_if(que.begin(), que.end(),
                            [page](std::pair<size_t, bool> pair) { return pair.first == page; }) != std::end(que);
    }

    bool read(size_t page) override {
        if (this->exists(page)) {
            const auto fst = std::find_if(que.begin(), que.end(),
                                          [page](std::pair<size_t, bool> pair) { return pair.first == page; });
            fst->second = true;
            return true;
        } else {
            if (que.size() == cache_size) {
                while (true) {
                    const auto[fst, snd] = que.front();
                    que.pop_front();
                    if (snd) {
                        que.emplace_back(fst, false);
                    } else {
                        break;
                    }
                }
            }
            que.emplace_back(page, false);
            return false;
        }
    }
};
}
```

#### FIFO-Second Chance O(1)

时间复杂度: `exists:O(1)`,`read:O(1)`(均摊)

``` cpp
namespace O1 {
class fifo_sc_cache final : private cache_base {
private:
    std::queue<size_t, std::list<size_t>> que;
    std::unordered_map<size_t, bool> umap;
public:
    explicit fifo_sc_cache(size_t size) : cache_base(size) {}

    bool exists(size_t page) const override {
        return umap.find(page) != umap.end();
    }

    bool read(size_t page) override {
        if (this->exists(page)) {
            umap[page] = true;
            return true;
        } else {
            if (que.size() == cache_size) {
                while (true) {
                    const auto key = que.front();
                    que.pop();
                    const auto hadVisit = umap[key];
                    umap[key] = false;
                    if (hadVisit) {
                        que.push(key);
                    } else {
                        umap.erase(key);
                        break;
                    }
                }
            }
            que.push(page);
            umap[page] = false;
            return false;
        }
    }
};
}
```
### Clock-An Simple FIFO-SC

FIFO之前的算法基础都是一个std::list-一个双链表, 这个双链表在内存分配上存在劣势, 如果说之前的FIFO时间较为均匀不需要考虑太多的话, FIFO-SC在最坏情况时间和cache大小成正比,系数反而变成了每次调用时间,因此存在优化的必要.

因此,采用一个固定大小的vector, 一个位置计数器来充当链表, 从而降低最坏情况下的调用时间.

PS: 实际上和FIFO-SC的原理一致, 只不过实现不同.

#### Clock O(n)

时间复杂度: `exists:O(n)`,`read:O(n)`

``` cpp
namespace On {
class clock_cache final : private cache_base {
private:
    std::vector<std::pair<size_t, bool>> que;// 双链表(大小固定)的和vector没区别
    size_t pointer = 0;
public:
    explicit clock_cache(size_t size) : cache_base(size),
                                        que(vector<std::pair<size_t, bool>>
                                                    (size, {std::numeric_limits<size_t>::max(), false})) {
        CHECK(size != 0);
    }

    bool exists(size_t page) const override {
        return std::find_if(que.begin(), que.end(),
                            [page](std::pair<size_t, bool> pair) { return pair.first == page; }) != std::end(que);
    }

    bool read(size_t page) override {
        if (this->exists(page)) {
            const auto fst = std::find_if(que.begin(), que.end(),
                                          [page](std::pair<size_t, bool> pair) { return pair.first == page; });
            fst->second = true;
            return true;
        } else {
            while (true) {
                const auto[fst, snd] = que[pointer % cache_size];
                que[pointer % cache_size].second = false;
                if (snd) {
                    pointer++;
                } else {
                    que[pointer % cache_size].first = std::numeric_limits<size_t>::max();
                    break;
                }
            }
            que[pointer % cache_size].first = page;
            que[pointer % cache_size].second = false;
            pointer++;
            return false;
        }
    }
};
}
```

#### Clock O(1)

时间复杂度: `exists:O(1)`,`read:O(1)`(均摊)

``` cpp
namespace O1 {
class clock_cache final : private cache_base {
private:
    std::vector<size_t> que;
    std::unordered_map<size_t, bool> umap;
    size_t pointer = 0;
public:
    explicit clock_cache(size_t size) : cache_base(size),
                                        que(vector<size_t>(size, std::numeric_limits<size_t>::max())) {
        CHECK(size != 0);
    }

    bool exists(size_t page) const override {
        return umap.find(page) != umap.end();
    }

    bool read(size_t page) override {
        if (this->exists(page)) {
            umap[page] = true;
            return true;
        } else {
            for (;; pointer = pointer % cache_size) {
                const auto key = que[pointer % cache_size];
                const auto hadVisit = umap[key];
                umap[key] = false;
                if (hadVisit) {
                    pointer++;
                } else {
                    que[pointer % cache_size] = std::numeric_limits<size_t>::max();
                    umap.erase(key);
                    break;
                }
            }
            que[pointer % cache_size] = page;
            umap[page] = false;
            pointer++;
            return false;
        }
    }
};
}
```

### LRU 最近最少使用

根据局部性原理, 最近被访问过的页面, 在接下来的访问中被访问的可能性也越高,因此应该在排除时给予其一个高系数.在实现中一般以将新元素加入列表头来实现. 而一旦页面被访问,但是页面在缓存中这个情况发生, 之前的几个算法都不对整个的列表顺序做更新, LRU通过在这个情况下, 将列表中的被访问元素抽取出来重新加到列表头, 更好的体现了局部性原理. 因此效率会更高

#### LRU-O(n)

时间复杂度: `exists:O(1)`,`read:O(n)`

``` cpp
namespace On {
class lru_cache final : public cache_base {
private:
    std::list<size_t> lru;
    std::unordered_set<size_t> uset;
public:
    explicit lru_cache(size_t size = 0) : cache_base(size) {}

    bool exists(size_t page) const override {
        return uset.find(page) != uset.end();
    }

    bool read(size_t page) override {
        const auto result = std::find(std::begin(lru), std::end(lru), page);
        const auto judge = (result != std::end(lru));
        if (judge) {
            lru.erase(result);
            lru.push_front(page);
        } else {
            if (lru.size() == cache_size) {
                lru.pop_back();
                uset.erase(lru.back());
            }
            lru.push_front(page);
            uset.insert(page);
        }
        return judge;
    }
};
}
```

虽然已经用uset进行了exists优化,但是需要从列表中剔除元素, 这个需要进行`std::find`的操作耗时仍然是`O(n)`

#### LRU-O(1)

时间复杂度: `exists:O(1)`,`read:O(1)`

``` cpp
namespace O1 {
class lru_cache final : public cache_base {
private:
    struct Node final : private nonCopyMoveAble {
        const size_t v;
        Node *before{nullptr};
        Node *next{nullptr};

        Node(size_t v, Node *before, Node *next) : v(v), before(before), next(next) {}
    };

    Node head{std::numeric_limits<size_t>::max(), nullptr, nullptr};
    std::unordered_map<size_t, Node *> umap;
public:
    explicit lru_cache(size_t size = 1) : cache_base(size) {
        assert(size != 0);
        this->head.next = &(this->head);
        this->head.before = &(this->head);
    }

    bool exists(size_t page) const override {
        return umap.count(page) != 0; // equal,
    }

    bool read(size_t page) override {
        if (this->exists(page)) {
            Node *const ptr = umap[page];
            // step1,摘出
            {
                Node *const pnext = ptr->next;
                Node *const pbefore = ptr->before;
                pbefore->next = pnext;
                pnext->before = pbefore;
            }
            // step2,接续
            {
                Node *const snd = head.next;
                head.next = ptr;
                snd->before = ptr;
                ptr->next = snd;
                ptr->before = &head;
            }
            return true;
        } else {
            if (umap.size() == this->cache_size) {
                Node *const last = head.before;
                Node *const last_snd = last->before;
                last_snd->next = &head;
                head.before = last_snd;
                umap.erase(last->v);
                delete last;
            }
            Node *const fst = new Node(page, &head, head.next);
            head.next->before = fst;
            head.next = fst;
            umap[page] = fst;
            return false;
        }
    }

    ~lru_cache() override {
        for (const auto&[k, v]: umap) {
            delete v;
        }
    }
};
}
```

通过手搓双链表, 并使用umap存储链表节点,实现了exists,read均为`O(1)`的操作,重点在于.

1. 需要使用一个永远存在的HEAD节点来简化操作
2. 页面存在时, 需要先将链表节点摘除, 再重新加入链表首部, 这样分布操作明确, 操作简介.
3. 当页面不存在于cache中时,移除最后一个元素后要将其手动delete,避免内存泄露

### 理论最优方法 MIN

上面几个缓存算法所依赖的输入都只是一串page序列, 如果我们能够 <del>预知未来</del>明确 每当需要排除列表中的一个内存页时, 哪一个内存页会在最长时间之后才被重新读取的话, 理论上来讲就可以取得更高的效率.

在这个情况下, 实际上最好维护一个优先队列, 队列中的一个基础struct包括内存页序号本身和其未来出现的时间, 优先队列以时间排序, 最小者在首部.每次命中时将命中的内存页排除,并重新读取; 每次排除时读取优先队列首部, 并将新元素插入优先队列.

问题在于优先队列本身不提供排除指定元素的功能,因此需要使用另外一个数据结构-set(没加unordered,底层为红黑树)来实现.

#### MIN

时间复杂度: `exists:O(1)`,`read:O(log(N))`

``` cpp
namespace OlogN {
using std::priority_queue, std::unordered_set, std::vector;

class min_cache final : private cache_base {
private:
    struct pn final {
        size_t page, next;
        //按next由大到小排列
        bool operator<(const pn &a) const { return this->next > a.next; }
    };

private:
    const vector<size_t> predict;
    size_t position{0};
    std::multiset<pn> pset{}; // 没想到set充当优先队列这么优秀
    std::unordered_set<size_t> uset{};
private:
    /**
     * Example
     * [1,2,3,4,5,2] && position 1, 所以从2开始搜索,找到下一个2,即第六个位置-5
     */
    size_t getNext(size_t page) {
        position += 1;
        for (size_t i{position}, size{predict.size()}; i < size; i++) {
            if (predict[i] == page) {
                return i;
            }
        }
        return std::numeric_limits<size_t>::max();
    }

public:
    explicit min_cache(size_t size, vector<size_t> pri) : cache_base(size), predict(std::move(pri)) {}

    [[nodiscard]] bool exists(size_t page) const override {
        return std::end(uset) != uset.find(page);
    }

    bool read(size_t page) override {
        if (this->exists(page)) {
            const auto iter = std::find_if(pset.begin(), pset.end(),
                                           [page](const auto& search) { return search.page == page; });
            pset.erase(iter);
            const auto next{this->getNext(page)};
            pset.insert({page, next});
            return true;
        } else {
            if (uset.size() == cache_size) {
                const auto top_iter = pset.cbegin();
                const auto top_v = top_iter->page;
                pset.erase(top_iter);
                uset.erase(top_v);
            }
            const auto next{this->getNext(page)};
            pset.insert({page, next});
            uset.insert(page);
            return false;
        }
    }
};
}
```

这里有个易错点, 或者说容易阴差阳错,错上加错, 反而无误的情况, 如果pset是set,则当其需要插入一个next为`SIZE_T_MAX`的值时,如果已经存在一个`SIZE_T_MAX`,则会插入失败(因为比较函数认为这两个相等),这个情况下和预期不同,但是如果都依照pset来判断反而能获取正确答案, why? 猜测是因为值为`SIZE_T_MAX`意味着再也不会被访问,这个情况下不如不加入.