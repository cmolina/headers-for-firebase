import { readFile, writeFile } from "node:fs/promises";
import { parse, stringify } from "comment-json";
import outdent from "outdent";

export class ParseFirebase {
    firebasePath: string;
    content: string;
    configuration: FirebaseConfig;

    static async createFromPath(firebasePath: string) {
        const parsed = new ParseFirebase();
        await parsed.readFile(firebasePath);
        parsed.firebasePath = firebasePath;
        return parsed;
    }

    async readFile(firebasePath: string) {
        this.content = await readFile(firebasePath, "utf-8");
        this.configuration = parse(this.content);

        if (this.insertIndex === undefined || this.deleteCount === undefined) {
            throw new Error(outdent`
                Please make sure you include the following comments within "hosting.headers":
                    /* _headers */
                    /* end _headers */
            `);
        }
    }

    get insertIndex() {
        const { headers } = this.configuration.hosting;

        const beforeComments = headers[Symbol.for("before")];
        if (hasOpeningComment(beforeComments)) {
            return 0;
        }

        for (let i = 0; i < headers.length; i++) {
            const beforeComments = headers[Symbol.for("before:" + i)];
            if (hasOpeningComment(beforeComments)) {
                return i;
            }

            const afterComments = headers[Symbol.for("after:" + i)];
            if (hasOpeningComment(afterComments)) {
                return i + 1;
            }
        }
    }

    get deleteCount() {
        const { headers } = this.configuration.hosting;

        const beforeComments = headers[Symbol.for("before")];
        if (hasClosingComment(beforeComments)) {
            return 0;
        }

        for (let i = 0; i < headers.length; i++) {
            const beforeComments = headers[Symbol.for("before:" + i)];
            if (hasClosingComment(beforeComments)) {
                return i - this.insertIndex;
            }

            const afterComments = headers[Symbol.for("after:" + i)];
            if (hasClosingComment(afterComments)) {
                return i + 1 - this.insertIndex;
            }
        };
    }

    insertHeaders(newHeaders: FirebaseHeader[]) {
        const { insertIndex,  deleteCount } = this;
        const { headers } = this.configuration.hosting;
        removeComments(headers, insertIndex, deleteCount);
        headers.splice(insertIndex, deleteCount, ...newHeaders);
        addOpeningCommentAt(insertIndex, headers);
        addClosingCommentAt(insertIndex + newHeaders.length - 1, headers);
    }

    async writeFile() {
        const updatedContent = stringify(this.configuration, undefined, this.space) + this.endOfFile;
        await writeFile(this.firebasePath, updatedContent, "utf-8");
    }

    get space() {
        return this.content.match(/^\{\n?(?<space>\s*)"/).groups.space;
    }

    get endOfFile() {
        return /\n$/.test(this.content) ? "\n" : "";;
    }
}

function hasOpeningComment(comments: CommentToken[] | undefined) {
    return comments?.some(c => c.value === " _headers ");
}

function hasClosingComment(comments: CommentToken[] | undefined) {
    return comments?.some(c => c.value === " end _headers ");
}

function removeComments(headers: FirebaseHeader[], insertIndex: number, deleteCount: number) {
    delete headers[Symbol.for("before")];
    delete headers[Symbol.for("before:" + insertIndex)];
    delete headers[Symbol.for("after:" + (insertIndex + deleteCount - 1))];
}

function addOpeningCommentAt(i: number, headers: FirebaseHeader[]) {
    const key = Symbol.for("before:" + i);
    if (!headers[key]) {
        headers[key] = [];
    }
    const openingComment: CommentToken = {
        type: "BlockComment",
        value: " _headers ",
        inline: false,
    };
    headers[key].push(openingComment);
}

function addClosingCommentAt(i: number, headers: FirebaseHeader[]) {
    const key = Symbol.for("after:" + i);
    if (!headers[key]) {
        headers[key] = [];
    }
    const closingComment: CommentToken = {
        type: "BlockComment",
        value: " end _headers ",
        inline: false,
    };
    headers[key].push(closingComment);
}

interface FirebaseConfig {
    hosting: {
        headers: FirebaseHeader[],
    },
}

interface FirebaseHeader {
    source: string,
    headers: {
        key: string,
        value: string,
    }[],
}

interface CommentToken {
    type: "BlockComment" | "LineComment",
    value: string,
    inline: boolean,
}
