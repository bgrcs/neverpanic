import {
  describe,
  expect,
  expectTypeOf,
  it,
} from "bun:test";

import { n, Result } from ".";

describe("safeFn", () => {
  it("should catch any thrown errors and return success false", async () => {
    const safeFunction = n.safeFn(
      async () => {
        throw new Error("Unexpected error.");
      },
      (originalError) => n.err(originalError),
    );

    const result = await safeFunction();

    expect(result.success).toBe(false);
  });

  it("should call and return the value from the error handler if an error is thrown", async () => {
    const expectedErrorMessage =
      "an-unknown-error-occured" as const;

    const safeFunction = n.safeFn(
      async () => {
        throw new Error("Unexpected error.");
      },
      () => n.err(expectedErrorMessage),
    );

    const result = await safeFunction();

    if (result.success)
      throw new Error("Result should not be success.");

    expect(result.success).toBe(false);
    expect(result.error).toBe(expectedErrorMessage);
  });

  it("should return the success result of the callback if it doesn't throw", async () => {
    const expectedData = "some data" as const;

    const safeFunction = n.safeFn(
      async () => {
        return { success: true, data: expectedData };
      },
      (originalError) => n.err(originalError),
    );

    const result = await safeFunction();

    if (!result.success)
      throw new Error("Result should be success.");

    expect(result.success).toBe(true);
    expect(result.data).toBe(expectedData);
  });

  it("should return the error result of the callback if it doesn't throw", async () => {
    const expectedError = "some-error" as const;

    const safeFunction = n.safeFn(
      async () => {
        return { success: false, error: expectedError };
      },
      (originalError) => n.err(originalError),
    );

    const result = await safeFunction();

    if (result.success)
      throw new Error("Result should not be success.");

    expect(result.success).toBe(false);
    expect(result.error).toBe(expectedError);
  });

  it("should pass arguments to the callback", async () => {
    const expectedName = "Bob";

    const safeFunction = n.safeFn(
      async (name: string) => {
        return { success: true, data: name };
      },
      (originalError) => n.err(originalError),
    );

    const result = await safeFunction(expectedName);

    if (!result.success)
      throw new Error("Result should be success.");

    expect(result.success).toBe(true);
    expect(result.data).toBe(expectedName);
  });

  it("should pass arguments to the error handler", async () => {
    const expectedName = "Bob";
    const expectedAge = 30;

    const safeFunction = n.safeFn(
      async (_name: string, _age: number) => {
        throw new Error("Unexpected error.");
      },
      (_err, name, age) => n.err({ name, age }),
    );

    const result = await safeFunction(expectedName, expectedAge);

    if (result.success)
      throw new Error("Result should be failure.");

    expect(result.error).toEqual({ name: expectedName, age: expectedAge });
  });
});

describe("fromUnsafe", () => {
  it("should return the value from the callback", () => {
    const expectedReturn = "some result";
    const result = n.fromUnsafe(
      () => expectedReturn,
      (originalError) => n.err(originalError),
    );

    if (!result.success)
      throw new Error("Result should be success.");

    expect(result.success).toBe(true);
    expect(result.data).toBe(expectedReturn);
  });

  it("should handle synchronous errors", async () => {
    const result = n.fromUnsafe(
      () => {
        if (true as boolean)
          throw new Error("Some synchronous error");
      },
      (originalError) => n.err(originalError),
    );

    if (result.success)
      throw new Error("Result should not be success.");

    expect(result.success).toBe(false);
  });

  it("should handle asynchronous errors", async () => {
    const result = await n.fromUnsafe(
      async () => {
        throw new Error("Some synchronous error");
      },
      (originalError) => n.err(originalError),
    );

    if (result.success)
      throw new Error("Result should not be success.");

    expect(result.success).toBe(false);
  });

  it("should call the error handler with the original error", async () => {
    let originalError: unknown;
    const thrownError = new Error("Some synchronous error");

    await n.fromUnsafe(
      async () => {
        throw thrownError;
      },
      (e) => {
        originalError = e;
        return n.err(originalError);
      },
    );

    expect(originalError).toBe(thrownError);
  });

  it("should call and return the value from the error handler if an error is thrown", async () => {
    const expectedError = "some-default-error" as const;

    const result = await n.fromUnsafe(
      async () => {
        throw new Error("Some synchronous error");
      },
      (originalError) => n.err(expectedError),
    );

    if (result.success)
      throw new Error("Result should not be success.");

    expect(result.success).toBe(false);
    expect(result.error).toBe(expectedError);
  });
});

describe("resultsToResult", () => {
  it("should return success false if a single result is success false", () => {
    const results = [
      { success: true, data: "some data" as const },
      { success: false, error: "SOME_ERROR" as const },
      {
        success: false,
        error: "SOME_OTHER_ERROR" as const,
      },
    ] satisfies Result[];

    const result = n.resultsToResult(results);

    if (result.success) {
      expectTypeOf(result).toMatchObjectType<{
        success: true;
        data: "some data"[];
      }>();
    }

    if (!result.success) {
      expectTypeOf(result).toMatchObjectType<{
        success: false;
        error: ("SOME_ERROR" | "SOME_OTHER_ERROR")[];
      }>();

      expect(result.success).toBe(false);
      expect(result.error).toMatchObject([
        "SOME_ERROR" as const,
        "SOME_OTHER_ERROR" as const,
      ]);
    }
  });

  it("should return success true if there are no success false results", () => {
    const results = [
      { success: true, data: "some data" as const },
      { success: true, data: "other data" as const },
    ] satisfies Result[];

    const result = n.resultsToResult(results);

    if (!result.success) {
      expectTypeOf(result).toMatchObjectType<{
        success: false;
        error: never[];
      }>();
      throw new Error("Should be success result.");
    }

    expectTypeOf(result).toMatchObjectType<{
      success: true;
      data: ("some data" | "other data")[];
    }>();

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject([
      "some data" as const,
      "other data" as const,
    ]);
  });
});
