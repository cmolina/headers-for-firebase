import { expect } from "chai";
import { addHeadersToFirebaseConfigFile } from "../src";
import { assertContentFiles, TempDir } from "./file-utils";

describe("addHeadersToFirebaseConfigFile", () => {
    let tempDir: TempDir;
    beforeEach(async () => {
        tempDir = await TempDir.createWith([
            "test/fixtures/_headers",
            "test/fixtures/firebase.json",
            "test/fixtures/firebase-no-comment.json",
        ]);
    });
    afterEach(async () => {
        await tempDir.remove();
    });

    it("should append headers to firebase.json", async () => {
        await addHeadersToFirebaseConfigFile(tempDir.getPathFor("_headers"), tempDir.getPathFor("firebase.json"));

        await assertContentFiles(tempDir.getPathFor("firebase.json"), "test/fixtures/expected-firebase.json");
    });

    it("should append headers to firebase.json only once when called twice", async () => {
        await addHeadersToFirebaseConfigFile(tempDir.getPathFor("_headers"), tempDir.getPathFor("firebase.json"));
        await addHeadersToFirebaseConfigFile(tempDir.getPathFor("_headers"), tempDir.getPathFor("firebase.json"));

        await assertContentFiles(tempDir.getPathFor("firebase.json"), "test/fixtures/expected-firebase.json");
    });

    it("should fail if firebase.json does not include insert comment", async () => {
        try {
            await addHeadersToFirebaseConfigFile(tempDir.getPathFor("_headers"), tempDir.getPathFor("firebase-no-comment.json"));
            expect.fail();
        } catch (error) {
            expect(error.message).to.include("/* _headers */");
            expect(error.message).to.include("/* end _headers */");
        }
    });

    it("should fail if _headers does not exist", async () => {
        try {
            await addHeadersToFirebaseConfigFile(tempDir.getPathFor("missing_headers"), tempDir.getPathFor("firebase.json"));
            expect.fail();
        } catch (error) {
            expect(error.code).to.include("ENOENT");
            expect(error.message).to.include("missing_headers");
        }
    });

    it("should fail if firebase.json does not exist", async () => {
        try {
            await addHeadersToFirebaseConfigFile(tempDir.getPathFor("_headers"), tempDir.getPathFor("missing_firebase.json"));
            expect.fail();
        } catch (error) {
            expect(error.code).to.include("ENOENT");
            expect(error.message).to.include("missing_firebase");
        }
    });
});
