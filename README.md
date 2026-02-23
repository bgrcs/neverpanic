# neverpanic

This is the next generation of error handling in JavaScript. How many times have
you gotten out of bed, ready to get on with your day, only to find that you have
1243 Sentry alerts because you forgot to gracefuly handle an exception in your
NodeJS backend. The truth is, these are not exceptions, these are panics. Panics
not just in your code, but also to your mental health.

Try neverpanic, and live a zen life.

## Examples

### safeFn

Create a safe function from an unsafe one:

- Ensures that only a `Result` can be returned
- Catches and returns any unexpected errors as a `Result`

```ts
const getUser = n.safeFn(
  async (id: string) => {
    const res = await fetch(
      `https://example.com/users/${id}`,
    );
    if (!res.ok)
      return { success: false, error: "FAILED_TO_FETCH" };

    return { success: true, data: await res.json() };
  },
  (err) => "FAILED_TO_GET_USER",
);

const getUserResult = await getUser("some-user-id");
if (!getUserResult.success) {
  console.error(getUserResult.error);
} else {
  console.log(getUserResult.data);
}
```

### fromUnsafe

Runs the provided callback function, catching any thrown errors and returning a
`Result`

```ts
const user = await n.fromUnsafe(
  () => db.findUser("some-user-id"),
  (err) => "FAILED_T0_FIND_USER",
);
if (!user.success) {
  console.error(user.error);
} else {
  console.log(user.data);
}
```
