import { describe, expect, it } from "bun:test";
import { n } from ".";

describe("safeFn", () => {
  it("should catch any thrown errors and return success false", async () => {
    const safeFunction = n.safeFn(async () => {
      throw new Error("Unexpected error.");
    });

    const result = await safeFunction();

    expect(result.success).toBe(false);
  });

  it("should call and return the value from the error handler if an error is thrown", async () => {
    const expectedErrorMessage = "an-unknown-error-occured" as const;

    const safeFunction = n.safeFn(
      async () => {
        throw new Error("Unexpected error.");
      },
      () => expectedErrorMessage
    );

    const result = await safeFunction();

    if (result.success) throw new Error("Result should not be success.");

    expect(result.success).toBe(false);
    expect(result.error).toBe(expectedErrorMessage);
  });

  it("should return the success result of the callback if it doesn't throw", async () => {
    const expectedData = "some data" as const;

    const safeFunction = n.safeFn(async () => {
      return { success: true, data: expectedData };
    });

    const result = await safeFunction();

    if (!result.success) throw new Error("Result should be success.");

    expect(result.success).toBe(true);
    expect(result.data).toBe(expectedData);
  });

  it("should return the error result of the callback if it doesn't throw", async () => {
    const expectedError = "some-error" as const;

    const safeFunction = n.safeFn(async () => {
      return { success: false, error: expectedError };
    });

    const result = await safeFunction();

    if (result.success) throw new Error("Result should not be success.");

    expect(result.success).toBe(false);
    expect(result.error).toBe(expectedError);
  });

  it("should pass arguments to the callback", async () => {
    const expectedName = "Bob";

    const safeFunction = n.safeFn(async (name: string) => {
      return { success: true, data: name };
    });

    const result = await safeFunction(expectedName);

    if (!result.success) throw new Error("Result should be success.");

    expect(result.success).toBe(true);
    expect(result.data).toBe(expectedName);
  });
});

describe("fromUnsafe", () => {
  it("should return the value from the callback", async () => {
    const expectedReturn = "some result";
    const result = await n.fromUnsafe(() => expectedReturn);

    if (!result.success) throw new Error("Result should be success.");

    expect(result.success).toBe(true);
    expect(result.data).toBe(expectedReturn);
  });

  it("should handle synchronous errors", async () => {
    const result = n.fromUnsafe(() => {
      if (true as boolean) throw new Error("Some synchronous error");
    });

    if (result.success) throw new Error("Result should not be success.");

    expect(result.success).toBe(false);
  });

  it("should handle asynchronous errors", async () => {
    const result = await n.fromUnsafe(async () => {
      throw new Error("Some synchronous error");
    });

    if (result.success) throw new Error("Result should not be success.");

    expect(result.success).toBe(false);
  });

  it("should call the error handler with the original error", async () => {
    let originalError: unknown;
    const thrownError = new Error("Some synchronous error");

    await n.fromUnsafe(
      async () => {
        throw thrownError;
      },
      (e) => (originalError = e)
    );

    expect(originalError).toBe(thrownError);
  });

  it("should call and return the value from the error handler if an error is thrown", async () => {
    const expectedError = "some-default-error" as const;

    const result = await n.fromUnsafe(
      async () => {
        throw new Error("Some synchronous error");
      },
      () => expectedError
    );

    if (result.success) throw new Error("Result should not be success.");

    expect(result.success).toBe(false);
    expect(result.error).toBe(expectedError);
  });
});
