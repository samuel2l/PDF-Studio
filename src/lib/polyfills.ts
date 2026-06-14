/** Polyfills required by pdf.js 5.x on older mobile browsers (e.g. iOS Safari). */
export function installPdfJsPolyfills(): void {
  if (!("getOrInsertComputed" in Map.prototype)) {
    Object.defineProperty(Map.prototype, "getOrInsertComputed", {
      value<T>(this: Map<unknown, T>, key: unknown, callback: () => T): T {
        if (this.has(key)) {
          return this.get(key) as T;
        }
        const value = callback();
        this.set(key, value);
        return value;
      },
      configurable: true,
      writable: true,
    });
  }

  if (!("getOrInsert" in Map.prototype)) {
    Object.defineProperty(Map.prototype, "getOrInsert", {
      value<V>(this: Map<unknown, V>, key: unknown, value: V): V {
        if (this.has(key)) {
          return this.get(key) as V;
        }
        this.set(key, value);
        return value;
      },
      configurable: true,
      writable: true,
    });
  }

  if (!(Promise as PromiseConstructor & { withResolvers?: unknown }).withResolvers) {
    (Promise as PromiseConstructor & {
      withResolvers: <T>() => {
        promise: Promise<T>;
        resolve: (value: T | PromiseLike<T>) => void;
        reject: (reason?: unknown) => void;
      };
    }).withResolvers = function withResolvers<T>() {
      let resolve!: (value: T | PromiseLike<T>) => void;
      let reject!: (reason?: unknown) => void;
      const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }
}

installPdfJsPolyfills();
