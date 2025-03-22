# WHAT

Turn off browser logging by declaring

```ts
declare global {
  interface Window {
    ENABLE_VINCENT_LOG: boolean;
  }
}

window.ENABLE_VINCENT_LOG = false;
```