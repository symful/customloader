import { join } from "../deps.ts";
import { codeToURI, wrapStr } from "./util.ts";

const textDecoder = new TextDecoder;

export interface Plugin {
    test(buf: Uint8Array, src: string): boolean;
    parse(buf: Uint8Array, src: string, opts: LoaderOptions): LoadReturn;
}

export interface LoaderOptions {
    jsonToTS: boolean;
    txtToTS: boolean;
}

export interface ParseOptions {
    buf: Uint8Array;
    src: string;
    ext?: string;
}

export class Loader {
    constructor(
        public plugins: Plugin[] = [],
        public opts: LoaderOptions = {
            jsonToTS: false,
            txtToTS: false
        },
    ) {}
    createImport(readFile = Deno.readFile) {
        return async (src: string) => {
            const buf = await readFile(src);

            return await this.load(this.parse({
                buf,
                src
            }));
        }
    }
    async loadBuf(buf: Uint8Array, contentType: string) {
        switch (contentType) {
            case "application/json": return JSON.parse(textDecoder.decode(buf));
            case "text/plain": return textDecoder.decode(buf);
            case "application/typescript": return await this.loadTS(textDecoder.decode(buf));
            case "application/javascript": return await this.loadJS(textDecoder.decode(buf));
            default: return buf;
        }
    }
    async loadJS(code: string) {
        return await import(codeToURI(code, "application/javascript"));
    }
    async loadTS(code: string) {
        return await import(codeToURI(code));
    }
    async loadCode(code: string, contentType: string) {
        switch (contentType) {
            case "application/json": return JSON.parse(code);
            case "text/plain": return code;
            case "application/typescript": return await this.loadTS(code);
            case "application/javascript": return await this.loadJS(code);
            default: throw new Error(`Invalid contentType`);
        }
    }
    async load(parsed: LoadReturn) {
        const {
            contentType
        } = parsed;
        let buf: Uint8Array;

        if ("uri" in parsed) {
            buf = await fetch(parsed.uri)
                .then((res) => res.blob())
                .then((blob) => blob.arrayBuffer())
                .then((arr) => new Uint8Array(arr));
        } else if ("root" in parsed) {
            buf = await Deno.readFile(parsed.root);
        } else if ("code" in parsed) {
            return this.loadCode(parsed.code, contentType);
        } else {
            buf = parsed.buf;
        }

        return this.loadBuf(buf, contentType);
    }
    parse({
        buf,
        src,
        ext,
    }: ParseOptions): LoadReturn {
        const { opts } = this;

        for (const plugin of this.plugins) {
            if (!plugin.test(buf, src)) continue;

            return plugin.parse(buf, src, opts);
        }

        ext ??= src.split(".").slice(1).join(".").toLowerCase();

        switch (ext) {
            case "js":
                return {
                    contentType: "application/javascript",
                    buf,
                };
            case "ts":
                return {
                    contentType: "application/typescript",
                    buf,
                };
            case "html":
                return {
                    contentType: "application/typescript",
                    code:
                        `import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.36-alpha/deno-dom-wasm.ts";\n\nexport default new DOMParser().parseFromString(${
                            wrapStr(textDecoder.decode(buf))
                        }, "text/html");`,
                };
            case "css":
                return {
                    contentType: "application/typescript",
                    code:
                        `import { parse } from "https://esm.sh/css@3.0.0";\n\nexport default parse(${
                            wrapStr(textDecoder.decode(buf))
                        });`,
                };
            case "txt":
                return opts.txtToTS ? {
                    contentType: "application/typescript",
                    code: `export default ${wrapStr(textDecoder.decode(buf))};`,
                } : {
                    contentType: "text/plain",
                    code: textDecoder.decode(buf)
                };
            case "json":
                return opts.jsonToTS
                    ? {
                        contentType: "application/typescript",
                        code: `export default ${textDecoder.decode(buf)};`,
                    }
                    : {
                        contentType: "application/json",
                        buf,
                    };
            default:
                return {
                    contentType: "application/typescript",
                    code: `export default new Uint8Array([${buf.join(", ")}]);`,
                };
        }
    }
    createParseHTTPFromFile(root: string) {
        return async (req: Request): Promise<LoadReturn> => {
            const { pathname, searchParams } = new URL(req.url);
            const path = join(root, pathname);
            const buf = await Deno.readFile(path);

            return this.parse({
                buf,
                src: path,
                ext: searchParams.get("ext") || undefined,
            });
        };
    }
}

export type LoadReturn =
    & ({
        uri: string;
    } | {
        buf: Uint8Array;
    } | {
        root: string;
    } | {
        code: string;
    })
    & {
        contentType: string;
    };
