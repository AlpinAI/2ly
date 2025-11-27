/**
 * Debounce an asynchronous task.
 */
export function debounce<T extends unknown[], S>(
  task: (...args: T) => Promise<S> | S,
  ms: number,
): (...args: T) => Promise<S> {
  let id: number | undefined;
  return (...args: T) =>
    new Promise((resolve, reject) => {
      clearTimeout(id);
      id = setTimeout(async () => {
        try {
          const res = await task(...args);
          resolve(res);
        } catch (e) {
          reject(e);
        }
      }, ms) as unknown as number;
    });
}
