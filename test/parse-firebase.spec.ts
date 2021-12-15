import { expect } from "chai";
import outdent from "outdent";
import { ParseFirebase } from "../src/parse-firebase.js";
import { assertContentFiles, TempDir } from "./file-utils.js";

describe("ParseFirebase", () => {
    let tempDir: TempDir;
    beforeEach(async () => {
        tempDir = await TempDir.createWith([
            "test/fixtures/firebase.json",
            "test/fixtures/firebase-comment-at-empty.json",
            "test/fixtures/firebase-comment-at-beginning.json",
            "test/fixtures/firebase-comment-at-end.json",
            "test/fixtures/firebase-comment-in-between.json",
            "test/fixtures/firebase-comment-with-content.json",
            "test/fixtures/firebase-no-comment.json",
            "test/fixtures/firebase-smaller-indentation.json",
            "test/fixtures/firebase-without-new-line-at-eof.json",
        ]);
    });
    afterEach(async () => {
        await tempDir.remove();
    });

    it("should read a file from a path", async () => {
        const parsed = await ParseFirebase.createFromPath(tempDir.getPathFor("firebase.json"));

        expect(parsed.content).to.include("/* _headers */");
    });

    describe("insertHeaders & writeFile", () => {
        const newHeader = {
            source: '/a-path.html',
            headers: [{ key: 'X-Header', value: "a value;" }],
        };
        it("should find the comments when headers is empty", async () => {
            const parsed = await ParseFirebase.createFromPath(tempDir.getPathFor("firebase-comment-at-empty.json"));

            parsed.insertHeaders([ newHeader ]);
            await parsed.writeFile();

            await assertContentFiles(tempDir.getPathFor("firebase-comment-at-empty.json"), "test/fixtures/expected-firebase-comment-at-empty.json");
        });

        it("should find the comments when they are at the beginning of headers", async () => {
            const parsed = await ParseFirebase.createFromPath(tempDir.getPathFor("firebase-comment-at-beginning.json"));

            parsed.insertHeaders([ newHeader ]);
            await parsed.writeFile();

            await assertContentFiles(tempDir.getPathFor("firebase-comment-at-beginning.json"), "test/fixtures/expected-firebase-comment-at-beginning.json");
        });

        it("should find the comments when they are at the end of headers", async () => {
            const parsed = await ParseFirebase.createFromPath(tempDir.getPathFor("firebase-comment-at-end.json"));

            parsed.insertHeaders([ newHeader ]);
            await parsed.writeFile();

            await assertContentFiles(tempDir.getPathFor("firebase-comment-at-end.json"), "test/fixtures/expected-firebase-comment-at-end.json");
        });

        it("should find the comments when they are in between of headers", async () => {
            const parsed = await ParseFirebase.createFromPath(tempDir.getPathFor("firebase-comment-in-between.json"));

            parsed.insertHeaders([ newHeader ]);
            await parsed.writeFile();

            await assertContentFiles(tempDir.getPathFor("firebase-comment-in-between.json"), "test/fixtures/expected-firebase-comment-in-between.json");
        });

        it("should find the comments when there is content", async () => {
            const parsed = await ParseFirebase.createFromPath(tempDir.getPathFor("firebase-comment-with-content.json"));

            parsed.insertHeaders([ newHeader ]);
            await parsed.writeFile();

            await assertContentFiles(tempDir.getPathFor("firebase-comment-with-content.json"), "test/fixtures/expected-firebase-comment-with-content.json");
        });

        it("should fail when no comments are found", async () => {
            try {
                await ParseFirebase.createFromPath(tempDir.getPathFor("firebase-no-comment.json"));
                expect.fail();
            } catch (error) {
                expect(error.message).to.equal(outdent`
                    Please make sure you include the following comments within "hosting.headers" at "${tempDir.getPathFor("firebase-no-comment.json")}":
                        /* _headers */
                        /* end _headers */
                    the new headers will appear between the comments.
                `);
            }
        });

        it("should conserve original spacing", async () => {
            const parsed = await ParseFirebase.createFromPath(tempDir.getPathFor("firebase-smaller-indentation.json"));

            parsed.insertHeaders([ newHeader ]);
            await parsed.writeFile();

            await assertContentFiles(tempDir.getPathFor("firebase-smaller-indentation.json"), "test/fixtures/expected-firebase-smaller-indentation.json");
        });

        it("should conserve original end of file", async () => {
            const parsed = await ParseFirebase.createFromPath(tempDir.getPathFor("firebase-without-new-line-at-eof.json"));

            parsed.insertHeaders([ newHeader ]);
            await parsed.writeFile();

            await assertContentFiles(tempDir.getPathFor("firebase-without-new-line-at-eof.json"), "test/fixtures/expected-firebase-without-new-line-at-eof.json");
        });
    });
});
