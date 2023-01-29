
import {
    join
} from "../deps.ts";
import { 
    codeToURI, 
    extToLanguage, 
    FileType
} from "./util.ts";

const textDecoder = new TextDecoder;
const textEncoder = new TextEncoder;

export function getLoadCSSURI(code: string) {
    return codeToURI(`import { parse } from "https://esm.sh/css@3.0.0";\n\nexport default parse((${JSON.stringify({ code })}).code)`);
}

export function getLoadHTMLURI(code: string) {
    return codeToURI(`import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.36-alpha/deno-dom-wasm.ts";\n\nexport default new DOMParser().parseFromString((${JSON.stringify({ code })}).code, "text/html");`);
}

export function loadHTTP(fileType: FileType, buf: Uint8Array): LoadReturn {
    switch (fileType) {
        case FileType.CSS: return {
            contentType: "application/typescript",
            uri: getLoadCSSURI(textDecoder.decode(buf))
        };
        case FileType.JavaScript: return {
            contentType: "text/javascript",
            buf
        };
        case FileType.JSON: return {
            contentType: "application/json",
            buf
        };
        case FileType.HTML: return {
            contentType: "application/typescript",
            uri: getLoadHTMLURI(textDecoder.decode(buf))
        };
        case FileType.TypeScript: return {
            contentType: "application/typescript",
            buf
        };
        default: return {
            contentType: "application/typescript",
            buf: textEncoder.encode(`export default new Uint8Array([${buf.join(", ")}]);`)
        }
    }
}

export function createLoadHTTPFromFile(root: string) {
    return async function loadHTTPFromFile(req: Request): Promise<LoadReturn> {
        const { pathname } = new URL(req.url);
        const path = join(root, pathname);
        const tmp = pathname.split(".");
        const ext = tmp.slice(1).join(".");
        const buf = await Deno.readFile(path);

        return loadHTTP(extToLanguage(ext), buf);
    }
}

export type LoadHTTP = (req: Request) => Promise<LoadReturn>

export type LoadReturn = ({
    uri: string
} | {
    buf: Uint8Array
} | {
    root: string
}) & {
    contentType: string
}