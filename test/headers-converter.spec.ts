import { expect } from "chai";
import { HeadersConverter } from "../src/headers-converter";

describe("HeadersConverter", () => {
    describe("number of targets", () => {
        it("should handle files with no targets", async () => {
            const converter = await HeadersConverter.createFromPath("test/fixtures/_headers-empty");

            expect(converter.firebaseHeaders).to.deep.equal([]);
        });

        it("should support files with 1 target", async () => {
            const converter = await HeadersConverter.createFromPath("test/fixtures/_headers-one-target");

            expect(converter.firebaseHeaders).to.deep.equal([
                createTargetFor("/**", { key: "Content-Security-Policy", value: "script-src https: http:" }),
            ]);
        });

        it("should support files with 2 targets", async () => {
            const converter = await HeadersConverter.createFromPath("test/fixtures/_headers-two-targets");

            expect(converter.firebaseHeaders).to.deep.equal([
                createTargetFor("/**", { key: "Access-Control-Allow-Origin", value: "*" }),
                createTargetFor("/secure/page", { key: "X-Frame-Options", value: "DENY" }),
            ]);
        });
    });

    describe("number of headers", () => {
        it("should skip a target without headers", async () => {
            const converter = await HeadersConverter.createFromPath("test/fixtures/_headers-target-without-headers");

            expect(converter.firebaseHeaders).to.deep.equal([]);
        });

        it("should support targets with multiple headers", async () => {
            const converter = await HeadersConverter.createFromPath("test/fixtures/_headers-target-with-multiple-headers");

            expect(converter.firebaseHeaders).to.deep.equal([
                createTargetFor("/secure/page",
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "no-referrer" },
                ),
            ]);
        });
    });

    it("should support targets with placeholders", async () => {
        const converter = await HeadersConverter.createFromPath("test/fixtures/_headers-target-with-placeholder");

        expect(converter.firebaseHeaders).to.deep.equal([
            createTargetFor("/movies/*", { key: "Access-Control-Allow-Origin", value: "*" }),
        ]);
    });

    it("should ignore comments", async () => {
        const converter = await HeadersConverter.createFromPath("test/fixtures/_headers-with-comments");

        expect(converter.firebaseHeaders).to.deep.equal([
            createTargetFor("/templates/index.html", { key: "X-Frame-Options", value: "SAMEORIGIN" }),
        ]);
    });

    it("should fail under unexpected content", async () => {
        try {
            const converter = await HeadersConverter.createFromPath("test/fixtures/_headers-unexpected");
            converter.firebaseHeaders;
            expect.fail();
        } catch (error) {
            expect(error.message).to.equal(
                `Failed to associate line "  no: source" to a target`
            );
        }
    });
});

function createTargetFor(source: string, ...headers: { key: string, value: string }[]) {
    return { source, headers };
}
