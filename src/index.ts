import { readFile, writeFile } from "node:fs/promises";

export async function addHeadersToFirebaseConfigFile(headersPath: string, firebasePath: string) {
    const headersContent = await readFile(headersPath, "utf-8");
    const headersArray = convertHeadersToFirebaseArray(headersContent);

    const { configuration, space, endOfFile } = await readFirebaseConfigurationFrom(firebasePath);
    configuration.hosting.headers.push(...headersArray);

    const updatedContent = JSON.stringify(configuration, undefined, space) + endOfFile;
    await writeFile(firebasePath, updatedContent, "utf-8");
}

async function readFirebaseConfigurationFrom(firebasePath: string) {
    const firebaseContent = await readFile(firebasePath, "utf-8");
    const configuration = JSON.parse(firebaseContent);
    const { space } = firebaseContent.match(/^\{\n?(?<space>\s*)"/).groups;
    const endOfFile = /\n$/.test(firebaseContent) ? "\n" : "";
    return { configuration, space, endOfFile };
}

export function convertHeadersToFirebaseArray(headersContent: string) {
    const targets = getTargetsFrom(headersContent);

    return targets.map(({ source, headers }) => {
        return {
            source: convertSource(source),
            headers: convertHeaders(headers),
        };
    });
}

function getTargetsFrom(headers: string) {
    const lines = headers.split("\n");
    const targets: Target[] = [];

    let currentTarget: Target;
    for (const line of lines) {
        if (isEmpty(line) || isComment(line)) {
            continue;
        }

        if (!hasIndentation(line)) {
            currentTarget = createEmptyTargetFor(line);
            targets.push(currentTarget);
            continue;
        }

        if (hasIndentation(line) && currentTarget) {
            currentTarget.headers.push(line.trim());
            continue;
        } else {
            throw new Error(`Failed to associate line "${line}" to a target`);
        }
    }

    return targets.filter(target => target.headers.length > 0);
}

function isEmpty(line: string) {
    return line.trim() === "";
}

function isComment(line: string) {
    return line.trim().startsWith("#");
}

function hasIndentation(line: string) {
    return /^\s/.test(line);
}

type Target = ReturnType<typeof createEmptyTargetFor>;

function createEmptyTargetFor(source: string) {
    return {
        source,
        headers: [] as string[],
    };
}

function convertSource(originalSource: string) {
    return originalSource.replace("*", "**").replace(/:\w+/, "*");
}

function convertHeaders(originalHeaders: string[]) {
    return originalHeaders.map(header => {
        const { key, value } = header.match(/^(?<key>[^:]*): (?<value>.*)$/).groups;
        return { key, value };
    });
}
