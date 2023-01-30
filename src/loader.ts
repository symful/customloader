import { join } from "../deps.ts";
import { wrapStr } from "./util.ts";

const textDecoder = new TextDecoder();

export interface Plugin {
    test(buf: Uint8Array, src: string): boolean;
    parse(buf: Uint8Array, src: string, opts: LoaderOptions): LoadReturn;
}

export interface LoaderOptions {
    jsonToTS: boolean;
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
        },
    ) {}
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
        const {
            jsonToTS,
        } = opts;

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
                return {
                    contentType: "application/typescript",
                    code: `export default ${wrapStr(textDecoder.decode(buf))};`,
                };
            case "json":
                return jsonToTS
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
