export const nextValue = <T>(list: readonly T[], currentValue: T) => {
  const currentIndex = list.indexOf(currentValue) ?? -1;
  const nextIndex = (currentIndex + 1) % list.length;
  return list[nextIndex]!;
};

export class NestedMap2<K1, K2, V> {
  private data = new Map<K1, Map<K2, V>>();

  constructor(entries?: Iterable<[K1, K2, V]>) {
    if (entries) {
      for (const [k1, k2, v] of entries) {
        this.set(k1, k2, v);
      }
    }
  }

  /** Количество всех хранимых значений */
  get size(): number {
    let count = 0;
    for (const inner of this.data.values()) {
      count += inner.size;
    }
    return count;
  }

  set(key1: K1, key2: K2, value: V): this {
    let inner = this.data.get(key1);
    if (!inner) {
      inner = new Map<K2, V>();
      this.data.set(key1, inner);
    }
    inner.set(key2, value);
    return this;
  }

  get(key1: K1, key2: K2): V | undefined {
    return this.data.get(key1)?.get(key2);
  }

  has(key1: K1, key2: K2): boolean {
    return this.data.get(key1)?.has(key2) ?? false;
  }

  delete(key1: K1, key2: K2): boolean {
    const inner = this.data.get(key1);
    if (!inner) return false;
    const deleted = inner.delete(key2);
    if (inner.size === 0) {
      this.data.delete(key1);
    }
    return deleted;
  }

  clear(): void {
    this.data.clear();
  }

  /** Получить вложенную Map для key1 (или undefined) */
  getInner(key1: K1): Map<K2, V> | undefined {
    return this.data.get(key1);
  }

  /** Проверить, существует ли внешний ключ */
  hasOuter(key1: K1): boolean {
    return this.data.has(key1);
  }

  /** Итератор по всем парам [k1, k2, v] */
  *entries(): IterableIterator<[K1, K2, V]> {
    for (const [k1, inner] of this.data) {
      for (const [k2, v] of inner) {
        yield [k1, k2, v];
      }
    }
  }

  /** Итератор по всем значениям */
  *values(): IterableIterator<V> {
    for (const inner of this.data.values()) {
      yield* inner.values();
    }
  }

  /** Итератор по всем составным ключам [k1, k2] */
  *keys(): IterableIterator<[K1, K2]> {
    for (const [k1, inner] of this.data) {
      for (const k2 of inner.keys()) {
        yield [k1, k2];
      }
    }
  }

  forEach(callback: (value: V, key1: K1, key2: K2, map: this) => void): void {
    for (const [k1, inner] of this.data) {
      inner.forEach((v, k2) => callback(v, k1, k2, this));
    }
  }

  [Symbol.iterator](): IterableIterator<[K1, K2, V]> {
    return this.entries();
  }
}

export class NestedMap3<K1, K2, K3, V> {
  private data = new Map<K1, NestedMap2<K2, K3, V>>();

  constructor(entries?: Iterable<[K1, K2, K3, V]>) {
    if (entries) {
      for (const [k1, k2, k3, v] of entries) {
        this.set(k1, k2, k3, v);
      }
    }
  }

  /** Количество всех хранимых значений */
  get size(): number {
    let count = 0;
    for (const inner of this.data.values()) {
      count += inner.size;
    }
    return count;
  }

  set(key1: K1, key2: K2, key3: K3, value: V): this {
    let inner = this.data.get(key1);
    if (!inner) {
      inner = new NestedMap2<K2, K3, V>();
      this.data.set(key1, inner);
    }
    inner.set(key2, key3, value);
    return this;
  }

  get(key1: K1, key2: K2, key3: K3): V | undefined {
    return this.data.get(key1)?.get(key2, key3);
  }

  has(key1: K1, key2: K2, key3: K3): boolean {
    return this.data.get(key1)?.has(key2, key3) ?? false;
  }

  delete(key1: K1, key2: K2, key3: K3): boolean {
    const inner = this.data.get(key1);
    if (!inner) return false;
    const deleted = inner.delete(key2, key3);
    if (inner.size === 0) {
      this.data.delete(key1);
    }
    return deleted;
  }

  clear(): void {
    this.data.clear();
  }

  /** Получить NestedMap2 для внешнего ключа (или undefined) */
  getInner(key1: K1): NestedMap2<K2, K3, V> | undefined {
    return this.data.get(key1);
  }

  hasOuter(key1: K1): boolean {
    return this.data.has(key1);
  }

  /** Итератор по всем [k1, k2, k3, v] */
  *entries(): IterableIterator<[K1, K2, K3, V]> {
    for (const [k1, inner] of this.data) {
      for (const [k2, k3, v] of inner.entries()) {
        yield [k1, k2, k3, v];
      }
    }
  }

  *values(): IterableIterator<V> {
    for (const inner of this.data.values()) {
      yield* inner.values();
    }
  }

  *keys(): IterableIterator<[K1, K2, K3]> {
    for (const [k1, inner] of this.data) {
      for (const [k2, k3] of inner.keys()) {
        yield [k1, k2, k3];
      }
    }
  }

  forEach(callback: (value: V, key1: K1, key2: K2, key3: K3, map: this) => void): void {
    for (const [k1, inner] of this.data) {
      inner.forEach((v, k2, k3) => callback(v, k1, k2, k3, this));
    }
  }

  [Symbol.iterator](): IterableIterator<[K1, K2, K3, V]> {
    return this.entries();
  }
}
