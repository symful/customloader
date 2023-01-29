import { 
    serveHTTP, 
    createLoadHTTPFromFile 
} from "../mod.ts";
import {
    fromFileUrl,
    join
} from "../deps.ts";

const conn = Deno.listen({
    port: 7000
});
const {
    hostname,
    port
} = <Deno.NetAddr>conn.addr;

console.log(`Listening on ${hostname}:${port}/`);

for await (const req of conn) {
    serveConn(req);
}

async function serveConn(conn: Deno.Conn) {
    for await (const req of Deno.serveHttp(conn)) {
        req.respondWith(await serveHTTP({
            req: req.request,
            load: createLoadHTTPFromFile(fromFileUrl(join(Deno.mainModule, "..", "static")))
        }));
    }
}