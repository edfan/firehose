/** Generic storage. */

export class Store {
  /** The current term. */
  readonly term: string;

  constructor(term: string) {
    this.term = term;
  }

  /** Convert a key to a local storage key. */
  toKey(key: string, global: boolean): string {
    return global ? `firehose-${key}` : `firehose-${this.term}-${key}`;
  }

  /** Return the corresponding, term-specific saved value. */
  get(key: string): string | null {
    return localStorage.getItem(this.toKey(key, false));
  }

  /** Return the corresponding global saved value. */
  globalGet(key: string): string | null {
    return localStorage.getItem(this.toKey(key, true));
  }

  /** Set the corresponding term-specific value. */
  set(key: string, value: string): void {
    localStorage.setItem(this.toKey(key, false), value);
  }

  /** Set the corresponding global saved value. */
  globalSet(key: string, value: string): void {
    localStorage.setItem(this.toKey(key, true), value);
  }
}
