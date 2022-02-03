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

由于这里不再对`this->que`施加`std::find`,因此采用std::list的包装类std::queue,略微简化操作.

#### FIFO-conclusion

FIFO的实现可以在O(1)内实现,并且比较简单,非常方便理解.

很明显, read中判断命中后,完全没有任何操作,因此浪费了一定的信息量, 这个算法还远远称不上好用.