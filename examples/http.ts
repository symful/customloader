import { serveHTTP } from "../mod.ts";
import { fromFileUrl, join } from "../deps.ts";
import { Loader } from "../src/loader.ts";

const loader = new Loader([], {
    jsonToTS: true,
    txtToTS: true
});
const parse = loader.createParseHTTPFromFile(
    fromFileUrl(join(Deno.mainModule, "..", "static"))
);
const conn = Deno.listen({
    port: 7000,
});
const {
    hostname,
    port,
} = <Deno.NetAddr> conn.addr;

console.log(`Listening on ${hostname}:${port}/`);

for await (const req of conn) {
    serveConn(req);
}

async function serveConn(conn: Deno.Conn) {
    for await (const req of Deno.serveHttp(conn)) {
        req.respondWith(
            await serveHTTP({
                req: req.request,
                parse,
            }),
        );
    }
}
