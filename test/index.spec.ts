import { expect } from "chai";
import { copyFile, readFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { convertHeadersToFirebaseArray, addHeadersToFirebaseConfigFile } from "../src";
import outdent from "outdent";

describe("convertHeadersToFirebaseArray", () => {
    describe("number of targets", () => {
        it("should handle files with no targets", () => {
            expect(convertHeadersToFirebaseArray("")).to.deep.equal([]);
        });

        it("should support files with 1 target", () => {
            const headers = outdent`
            /*
                Content-Security-Policy: script-src https: http:
            `;

            const array = convertHeadersToFirebaseArray(headers);

            expect(array).to.deep.equal([
                createTargetFor("/**", { key: "Content-Security-Policy", value: "script-src https: http:" }),
            ]);
        });

        it("should support files with 2 targets", () => {
            const headers = outdent`
            /*
                Access-Control-Allow-Origin: *
            /secure/page
                X-Frame-Options: DENY
            `;

            const array = convertHeadersToFirebaseArray(headers);

            expect(array).to.deep.equal([
                createTargetFor("/**", { key: "Access-Control-Allow-Origin", value: "*" }),
                createTargetFor("/secure/page", { key: "X-Frame-Options", value: "DENY" }),
            ]);
        });
    });

    describe("number of headers", () => {
        it("should skip a target with no headers", () => {
            const headers = "*";

            const array = convertHeadersToFirebaseArray(headers);

            expect(array).to.deep.equal([]);
        });

        it("should support targets with multiple headers", () => {
            const headers = outdent`
            /secure/page
                X-Frame-Options: DENY
                X-Content-Type-Options: nosniff
                Referrer-Policy: no-referrer
            `;

            const array = convertHeadersToFirebaseArray(headers);

            expect(array).to.deep.equal([
                createTargetFor("/secure/page",
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "no-referrer" },
                ),
            ]);
        });
    });

    it("should support targets with placeholders", () => {
        const headers = outdent`
        /movies/:title
            Access-Control-Allow-Origin: *
        `;

        const array = convertHeadersToFirebaseArray(headers);

        expect(array).to.deep.equal([
            createTargetFor("/movies/*", { key: "Access-Control-Allow-Origin", value: "*" }),
        ]);
    });

    it("should ignore comments", () => {
        const headers = outdent`
        # a path:
        /templates/index.html
            # headers for that path:
            X-Frame-Options: SAMEORIGIN
        `;

        const array = convertHeadersToFirebaseArray(headers);

        expect(array).to.deep.equal([
            createTargetFor("/templates/index.html", { key: "X-Frame-Options", value: "SAMEORIGIN" }),
        ]);
    });

    it("should fail under unexpected content", () => {
        expect(() => convertHeadersToFirebaseArray("  no: source")).to.throw(`Failed to associate line "  no: source" to a target`);
    });
});

function createTargetFor(source: string, ...headers: { key: string, value: string }[]) {
    return { source, headers };
}

describe("addHeadersToFirebaseConfigFile", () => {
    let tempDir: string;
    beforeEach(async () => {
        tempDir = await mkdtemp(join(tmpdir(), "headers-for-firebase"));
        await copyFile("test/fixtures/_headers", pathFor("_headers"));
        await copyFile("test/fixtures/firebase.json", pathFor("firebase.json"));
    });
    afterEach(async () => {
        await rm(tempDir, { recursive: true, force: true });
    });

    it("should append headers to firebase.json", async () => {
        await addHeadersToFirebaseConfigFile(pathFor("_headers"), pathFor("firebase.json"));

        await assertContentFiles(pathFor("firebase.json"), "test/fixtures/expected-firebase.json");
    });

    it("should fail if _headers does not exist", async () => {
        try {
            await addHeadersToFirebaseConfigFile(pathFor("missing_headers"), pathFor("firebase.json"));
            expect.fail();
        } catch (error) {
            expect(error.code).to.include("ENOENT");
            expect(error.message).to.include("missing_headers");
        }
    });

    it("should fail if firebase.json does not exist", async () => {
        try {
            await addHeadersToFirebaseConfigFile(pathFor("_headers"), pathFor("missing_firebase.json"));
            expect.fail();
        } catch (error) {
            expect(error.code).to.include("ENOENT");
            expect(error.message).to.include("missing_firebase");
        }
    });

    function pathFor(filename: string) {
        return join(tempDir, filename);
    }
});

async function assertContentFiles(actualFilePath: string, expectedFilePath: string) {
    expect(await readFile(actualFilePath, "utf-8")).to.equal(await readFile(expectedFilePath, "utf-8"));
}
