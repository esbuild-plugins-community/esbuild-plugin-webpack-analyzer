const KEY_PREFIX = 'wba';

export default {
  getItem(key: string): unknown {
    try {
      return JSON.parse(globalThis.localStorage.getItem(`${KEY_PREFIX}.${key}`) ?? 'null');
    } catch {
      return null;
    }
  },

  setItem(key: string, value: unknown): void {
    try {
      globalThis.localStorage.setItem(`${KEY_PREFIX}.${key}`, JSON.stringify(value));
    } catch {
      /* ignored */
    }
  },

  removeItem(key: string): void {
    try {
      globalThis.localStorage.removeItem(`${KEY_PREFIX}.${key}`);
    } catch {
      /* ignored */
    }
  },
};
