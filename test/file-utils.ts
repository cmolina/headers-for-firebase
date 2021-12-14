import { expect } from "chai";
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { join, basename } from "node:path";
import { tmpdir } from "node:os";

export class TempDir {
    path: string;
    static async createWith(filePaths: string[]) {
        const tempDir = new TempDir();
        tempDir.path = await mkdtemp(join(tmpdir(), "headers-for-firebase"));
        await Promise.all(filePaths.map(path => copyFile(path, tempDir.getPathFor(basename(path)))));
        return tempDir;
    }

    getPathFor(filename: string) {
        return join(this.path, filename);
    }

    remove() {
        return rm(this.path, { recursive: true, force: true });
    }
}

export async function assertContentFiles(actualFilePath: string, expectedFilePath: string) {
    expect(await readFile(actualFilePath, "utf-8")).to.equal(await readFile(expectedFilePath, "utf-8"));
}
