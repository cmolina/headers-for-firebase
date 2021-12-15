import { ParseFirebase } from "./parse-firebase.js";
import { HeadersConverter } from "./headers-converter.js";

export async function addHeadersToFirebaseConfigFile(headersPath: string, firebasePath: string) {
    const { firebaseHeaders } = await HeadersConverter.createFromPath(headersPath);
    const parsed = await ParseFirebase.createFromPath(firebasePath);
    parsed.insertHeaders(firebaseHeaders);
    await parsed.writeFile();
    return firebaseHeaders.length;
}
