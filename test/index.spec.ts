import { expect } from "chai";
import { convertHeadersToFirebaseArray } from "../src";
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
