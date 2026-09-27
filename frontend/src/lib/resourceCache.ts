/** 会话内的 stale-while-revalidate 缓存。不持久化业务数据；各资源独立更新。 */
type Loaders<T> = { [K in keyof T]: () => Promise<T[K]> };
type CachedData<T> = { [K in keyof T]: T[K] | null };

interface Entry {
  updatedAt: number;
  version: number;
  watchers: number;
  failed: boolean;
  pending: Promise<void> | null;
}

export interface ResourceSnapshot<T> {
  data: CachedData<T>;
  loading: boolean;
  failed: (keyof T)[];
  updatedAt: number;
}

export class ResourceCache<T extends object> {
  private readonly loaders: Loaders<T>;
  private readonly ttl: number;
  private readonly clock: () => number;
  private readonly keys: (keyof T)[];
  private readonly entries = new Map<keyof T, Entry>();
  private readonly listeners = new Set<() => void>();
  private snapshot: ResourceSnapshot<T>;
  private disposed = false;

  constructor(loaders: Loaders<T>, ttl = 60_000, clock = Date.now) {
    this.loaders = loaders;
    this.ttl = ttl;
    this.clock = clock;
    this.keys = Object.keys(loaders) as (keyof T)[];
    this.snapshot = this.emptySnapshot();
    this.keys.forEach((key) => {
      this.entries.set(key, { updatedAt: 0, version: 0, watchers: 0, failed: false, pending: null });
    });
  }

  private emptySnapshot(): ResourceSnapshot<T> {
    return {
      data: Object.fromEntries(this.keys.map((key) => [key, null])) as CachedData<T>,
      loading: false,
      failed: [],
      updatedAt: 0,
    };
  }

  getSnapshot = (): ResourceSnapshot<T> => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** 只后台更新仍被页面使用的资源；离开首页后无需轮询全部统计。 */
  watch(keys: readonly (keyof T)[] = this.keys): () => void {
    keys.forEach((key) => {
      this.entries.get(key)!.watchers += 1;
    });
    void this.refresh(keys);
    return () => {
      keys.forEach((key) => {
        this.entries.get(key)!.watchers -= 1;
      });
    };
  }

  refresh(keys: readonly (keyof T)[] = this.keys, force = false): Promise<void> {
    return Promise.all(keys.map((key) => this.load(key, force))).then(() => undefined);
  }

  /** 非 Hook 页面复用同一份短时缓存，首次/过期读取等待新值，失败时保留旧值。 */
  async getValue<K extends keyof T>(key: K): Promise<T[K]> {
    const entry = this.entries.get(key)!;
    // 读取途中若有写入使请求作废，命令式页面也要等新版本，不能取旧快照。
    while (!this.disposed) {
      const version = entry.version;
      await this.load(key, false);
      if (entry.version === version) break;
    }
    const value = this.snapshot.data[key];
    if (value === null) throw new Error(`${String(key)} 加载失败`);
    return value;
  }

  refreshWatched = (): void => {
    void this.refresh(this.keys.filter((key) => this.entries.get(key)!.watchers > 0));
  };

  invalidate(keys: readonly (keyof T)[]): void {
    if (this.disposed || keys.length === 0) return;
    keys.forEach((key) => {
      const entry = this.entries.get(key)!;
      entry.updatedAt = 0;
      entry.version += 1;
    });
    this.refreshWatched();
  }

  /** 注销后立即丢弃内容，且不接受旧请求的迟到响应。 */
  dispose(): void {
    this.disposed = true;
    this.snapshot = this.emptySnapshot();
    this.listeners.forEach((listener) => listener());
    this.listeners.clear();
  }

  private publish(): void {
    this.snapshot = {
      ...this.snapshot,
      loading: this.keys.some((key) => this.entries.get(key)!.pending !== null),
      failed: this.keys.filter((key) => this.entries.get(key)!.failed),
    };
    this.listeners.forEach((listener) => listener());
  }

  private load<K extends keyof T>(key: K, force: boolean): Promise<void> {
    const entry = this.entries.get(key)!;
    if (this.disposed) return Promise.resolve();
    // StrictMode、首页和侧栏同时请求、连续点击刷新均复用同一请求。
    if (entry.pending) return entry.pending;
    if (!force && entry.updatedAt > 0 && this.clock() - entry.updatedAt < this.ttl) {
      return Promise.resolve();
    }
    const version = entry.version;
    entry.failed = false;
    entry.pending = Promise.resolve()
      .then(async () => {
        if (this.disposed) return;
        const value = await this.loaders[key]();
        if (this.disposed || version !== entry.version) return;
        entry.updatedAt = this.clock();
        this.snapshot = {
          ...this.snapshot,
          data: { ...this.snapshot.data, [key]: value },
          updatedAt: entry.updatedAt,
        };
      })
      .catch(() => {
        if (!this.disposed && version === entry.version) entry.failed = true;
        // 保留上次成功结果。错误由 snapshot.failed 告知页面，不冒充空数据。
      })
      .finally(() => {
        entry.pending = null;
        if (this.disposed) return;
        this.publish();
        // 请求途中发生写入时，旧响应不能覆盖写入后的统计，补一次最新读取。
        if (version !== entry.version && entry.watchers > 0) void this.load(key, true);
      });
    this.publish();
    return entry.pending;
  }
}

/** 按 ID 缓存详情请求；与首页缓存一样只保留在当前会话内，默认 60 秒过期。 */
export class KeyedResourceCache<K, V> {
  private readonly loader: (key: K) => Promise<V>;
  private readonly ttl: number;
  private readonly clock: () => number;
  private readonly entries = new Map<K, {
    value: V | null;
    updatedAt: number;
    pending: Promise<V> | null;
  }>();

  constructor(
    loader: (key: K) => Promise<V>,
    ttl = 60_000,
    clock: () => number = Date.now,
  ) {
    this.loader = loader;
    this.ttl = ttl;
    this.clock = clock;
  }

  get(key: K): Promise<V> {
    let entry = this.entries.get(key);
    if (!entry) {
      entry = { value: null, updatedAt: 0, pending: null };
      this.entries.set(key, entry);
    }
    if (entry.value !== null && this.clock() - entry.updatedAt < this.ttl) {
      return Promise.resolve(entry.value);
    }
    if (entry.pending) return entry.pending;

    const current = entry;
    const request = Promise.resolve().then(() => this.loader(key)).then((value) => {
      if (this.entries.get(key) === current) {
        current.value = value;
        current.updatedAt = this.clock();
      }
      return value;
    }).finally(() => {
      if (current.pending === request) current.pending = null;
    });
    current.pending = request;
    return request;
  }

  set(key: K, value: V): void {
    this.entries.set(key, { value, updatedAt: this.clock(), pending: null });
  }

  clear(): void {
    this.entries.clear();
  }
}
