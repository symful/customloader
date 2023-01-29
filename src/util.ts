

export enum FileType {
    JavaScript = "JavaScript",
    TypeScript = "TypeScript",
    CSS = "CSS",
    Text = "Text",
    Buffer = "Buffer",
    JSON = "JSON",
    HTML = "HTML"
}

export function codeToURI(code: string, lang = "typescript") {
    return `data:application/${lang};base64,${btoa(code)}`;
}

export enum FileExt {
    JavaScript = "js",
    TypeScript = "ts",
    Text = "txt",
    HTML = "html",
    JSON = "json",
    Buffer = "",
    CSS = "css"
}

export function extToLanguage(ext: string): FileType {
    switch (ext.toLowerCase()) {
        case FileExt.CSS: return FileType.CSS;
        case FileExt.HTML: return FileType.HTML;
        case FileExt.TypeScript: return FileType.TypeScript;
        case FileExt.JavaScript: return FileType.JavaScript;
        case FileExt.Text: return FileType.Text;
        case FileExt.JSON: return FileType.JSON;
        default: return FileType.Buffer;
    }
}