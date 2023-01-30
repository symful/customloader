export function codeToURI(code: string, mimeType = "application/typescript") {
    return `data:${mimeType};base64,${btoa(code)}`;
}

export function wrapStr(str: string, wrapper = "`") {
    return `${wrapper}${
        str
            .replaceAll("\\", "\\\\")
            .replaceAll(wrapper, `\\${wrapper}`)
    }${wrapper}`;
}
