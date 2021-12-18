import { ParseFirebase } from "./parse-firebase.js";
import { HeadersConverter } from "./headers-converter.js";

export async function addHeadersToFirebaseConfigFile(headersPath: string, firebasePath: string) {
    const { firebaseHeaders } = await HeadersConverter.createFromPath(headersPath);
    const parsed = await ParseFirebase.createFromPath(firebasePath);
    firebaseHeaders.sort((a, b) => a.source.localeCompare(b.source));
    parsed.insertHeaders(firebaseHeaders);
    await parsed.writeFile();
    return firebaseHeaders.length;
}
