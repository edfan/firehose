import { Preferences, Save } from "./state";

export type TermStore = {
  saves: Save[];
  [saveId: string]: any[];
};

export type GlobalStore = {
  preferences: Preferences;
};

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
  get<T extends keyof TermStore>(key: T): TermStore[T] | null {
    const result = localStorage.getItem(this.toKey(key.toString(), false));
    return result !== null ? (JSON.parse(result) as TermStore[T]) : null;
  }

  /** Return the corresponding global saved value. */
  globalGet<T extends keyof GlobalStore>(key: T): GlobalStore[T] | null {
    const result = localStorage.getItem(this.toKey(key.toString(), true));
    return result !== null ? (JSON.parse(result) as GlobalStore[T]) : null;
  }

  /** Set the corresponding term-specific value. */
  set<T extends keyof TermStore>(key: T, value: TermStore[T]): void {
    localStorage.setItem(
      this.toKey(key.toString(), false),
      JSON.stringify(value)
    );
  }

  /** Set the corresponding global saved value. */
  globalSet<T extends keyof GlobalStore>(key: T, value: GlobalStore[T]): void {
    localStorage.setItem(
      this.toKey(key.toString(), true),
      JSON.stringify(value)
    );
  }
}
