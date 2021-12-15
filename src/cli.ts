#!/usr/bin/env node
import cac from "cac";
import { addHeadersToFirebaseConfigFile } from "./index.js";

const cli = cac();

cli
    .command("", "Convert headers from `_headers`, and put them into `firebase.json`'s `hosting.headers` array.")
    .option("--headers <headers>", "Path to origin `_headers` file", { default: "./_site/_headers" })
    .option("--firebase <firebase>", "Path to target `firebase.json` file", { default: "./firebase.json" })
    .action(async ({ headers, firebase }) => {
        try {
            const numberOfHeadersAdded = await addHeadersToFirebaseConfigFile(headers, firebase);
            console.log(`Successfully added ${numberOfHeadersAdded} targets from "${headers}" to "${firebase}".`);
        } catch (error) {
            if (error.code === "ENOENT") {
                console.error(`Failed to read "${error.path}"; please confirm the file exists.`);
            } else {
                throw error;
            }
        }
    });

cli
    .help()
    .parse();
