export type Result<T = unknown, E = unknown> =
  | {
      success: true;
      data: T;
    }
  | { success: false; error: E };

type DataOf<R extends Result> = R extends {
  success: true;
  data: infer D;
}
  ? D
  : never;
type ErrorOf<R extends Result> = R extends {
  success: false;
  error: infer E;
}
  ? E
  : never;

/**
 * Create a typesafe instance of neverpanic.
 *
 * @returns An instance of neverpanic that conforms to the types specified in the generic arguments.
 *
 * @example
 * const getUser = n.safeFn(
 *   async (id: string) => {
 *     const res = await fetch(`https://example.com/users/${id}`);
 *     if (!res.ok) return { success: false, error: "FAILED_TO_FETCH" };
 *
 *     return { success: true, data: await res.json() };
 *   },
 *   () => "FAILED_TO_GET_USER"
 * );
 *
 * const getUserResult = await getUser("some-user-id");
 * if (!getUserResult.success) {
 *   console.error(getUserResult.error);
 * } else {
 *   console.log(getUserResult.data);
 * }
 */
export const createNeverpanic = <
  D = unknown,
  E = unknown,
>() => {
  const ok = <const T extends D>(
    data: T,
  ): { success: true; data: T } => ({
    success: true as const,
    data,
  });

  const err = <const T extends E>(
    error: T,
  ): { success: false; error: T } => ({
    success: false as const,
    error,
  });

  /**
   * Create a safe function from an unsafe one.
   *
   * @param cb - The async function to wrap.
   * @param [eh] - Optional fallback error handler.
   * @returns A new function that returns a typesafe Result.
   *
   * @example
   * const getUser = n.safeFn(
   *   async (id: string) => {
   *     const res = await fetch(`https://example.com/users/${id}`);
   *     if (!res.ok) return { success: false, error: "FAILED_TO_FETCH" };
   *
   *     return { success: true, data: await res.json() };
   *   },
   *   () => "FAILED_TO_GET_USER"
   * );
   *
   * const getUserResult = await getUser("some-user-id");
   * if (!getUserResult.success) {
   *   console.error(getUserResult.error);
   * } else {
   *   console.log(getUserResult.data);
   * }
   */
  const safeFn =
    <
      T extends Result<D, E> | Promise<Result<D, E>>,
      A extends unknown[],
      EH extends Result<D, E>,
    >(
      cb: (...args: A) => T,
      eh: (e: unknown, ...args: A) => EH,
    ): ((...args: A) => T | EH) =>
    (...args) => {
      try {
        const result = cb(...args);

        if (result instanceof Promise)
          return result.catch((e) => eh(e, ...args)) as T;

        return result;
      } catch (e) {
        return eh(e, ...args);
      }
    };

  /**
   * Run an unsafe function, handle any errors and return a Result.
   *
   * @param cb - The async function to call.
   * @param [eh] - Optional fallback error handler.
   * @returns The awaited return value of cb.
   *
   * @example
   * const user = await n.fromUnsafe(() => db.findUser('some-user-id'), () => 'FAILED_T0_FIND_USER')
   * if (!user.success) {
   * 	console.error(user.error)
   * } else {
   * 	console.log(user.data)
   * }
   */
  const fromUnsafe = <
    T extends D | Promise<D>,
    EH extends Result<D, E>,
    R = T extends Promise<infer U>
      ? Promise<{ success: true; data: U }>
      : { success: true; data: T },
  >(
    cb: () => T,
    eh: (err: unknown) => EH,
  ): R | EH => {
    try {
      const result = cb();

      if (result instanceof Promise)
        return result.then(ok).catch(eh) as R;

      return ok(result as D) as R;
    } catch (e) {
      return eh(e);
    }
  };

  /**
   * Convert a list of results into a single result.
   *
   * @param results - A list of Results.
   * @returns A single result containing the data / errors of the input results.
   *
   * @example
   * const findUserResults = userIds.map((userId) =>
   *   n.fromUnsafe(
   *     () => db.findUser(userId),
   *     () => "FAILED_TO_FIND_USER" as const,
   *   ),
   * );
   *
   * const result = n.resultsToResult(findUserResults)
   */
  const resultsToResult = <R extends Result[]>(
    results: R,
  ): Result<DataOf<R[number]>[], ErrorOf<R[number]>[]> => {
    const errors = results
      .filter((result) => !result.success)
      .map((result) => result.error as ErrorOf<R[number]>);

    if (errors.length)
      return {
        success: false,
        error: errors,
      };

    const successes = results
      .filter((result) => !!result.success)
      .map((result) => result.data as DataOf<R[number]>);

    return {
      success: true,
      data: successes,
    };
  };

  return {
    ok,
    err,
    safeFn,
    fromUnsafe,
    resultsToResult,
  };
};

export const n = createNeverpanic();
