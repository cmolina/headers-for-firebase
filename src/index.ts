import { ParseFirebase } from "./parse-firebase";
import { HeadersConverter } from "./headers-converter";

export async function addHeadersToFirebaseConfigFile(headersPath: string, firebasePath: string) {
    const { firebaseHeaders } = await HeadersConverter.createFromPath(headersPath);
    const parsed = await ParseFirebase.createFromPath(firebasePath);
    parsed.insertHeaders(firebaseHeaders);
    await parsed.writeFile();
}
