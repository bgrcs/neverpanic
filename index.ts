export type Result<T = unknown, E = unknown> =
  | {
      success: true;
      data: T;
    }
  | { success: false; error: E };

export const createNeverpanic = <
  D = unknown,
  E = unknown,
>() => {
  const ok = <const T extends D>(
    data: T,
  ): Result<T, never> => ({
    success: true,
    data,
  });

  const err = <const T extends E>(
    error: T,
  ): Result<never, T> => ({
    success: false,
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
      eh: (e: unknown) => EH,
    ): ((...args: A) => T | EH) =>
    (...args) => {
      try {
        const result = cb(...args);

        if (result instanceof Promise)
          return result.catch(eh) as T;

        return result;
      } catch (e) {
        return eh(e);
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
  const resultsToResult = <
    T extends Result<D, E>[],
    TD extends Extract<T[number], { success: true }>,
    TE extends Extract<T[number], { success: false }>,
  >(
    results: T,
  ): Result<TD[], TE[]> => {
    const errors = results.filter(
      (result): result is TE => !result.success,
    );

    if (errors.length)
      return {
        success: false,
        error: errors,
      };

    const successes = results.filter(
      (result): result is TD => result.success,
    );

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
