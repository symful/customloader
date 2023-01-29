# CustomLoader
A Deno custom loader for supporting importing other files for the sake of types. 
For parsing HTML, it uses [Deno DOM](https://deno.land/x/deno_dom@v0.1.36-alpha)
For parsing CSS, it uses [NPM/CSS](https://esm.sh/css@3.0.0)
For other ext files those are not supported by ESM, it will just make a TypeSCript file that export Uint8Array.

# Examples
You can check `examples/http.ts`. Basically it will make a HTTP server so Deno can cache the files and there will be TypeScript types. You can try by running
```bash
$ deno run -A examples/http.ts
```
```bash
$ deno run -A examples/client.ts
```

# Caution
It is not extendable and production ready yet.