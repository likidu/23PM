type AwaitedInput<T> = PromiseLike<T> | T;

export type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
