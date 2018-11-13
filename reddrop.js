#!/usr/bin/env node

const {readFile, unlink} = require("fs");
const {basename} = require("path");
const Redis = require("redis");
const fail = require("@zingle/fail");

if (process.argv[2] === "--help") {
    showhelp();
    process.exit(0);
}

const date = new Date();
const args = process.argv.slice();
const node = args.shift();
const script = args.shift();
const endpoint = args.shift();
const key = args.shift();
const ref = args.shift();
const file = args.shift();

if (!endpoint) fail(new Error("missing redis endpoint"), 1);
if (!key) fail(new Error("missing redis key"), 1);
if (!ref) fail(new Error("missing reference identifier"), 1);
if (!file) fail(new Error("missing drop file"), 1);
if (args.length) fail(new Error("unexpected argument"), 2);

const redis = Redis.createClient(endpoint);
const filename = basename(file);
const entry = {ref, date, filename};

readFile(file, "binary", (err, content) => {
    if (err) return fail(err, 10);

    entry.content = content;

    redis.lpush(key, JSON.stringify(entry), (err, result) => {
        if (err) return fail(err);

        console.log(`dropped file '${filename}'; ${result} pending`);

        redis.quit();

        unlink(file, err => {
            if (err) console.warn(`could not remove '${file}' (${err.message})`);
        });
    });
});

function showhelp() {
    console.log("Usage:");
    console.log("  reddrop <uri> <key> <ref> <file>");
    console.log("  reddrop --help");
    console.log();
    console.log("Drop file into Redis and delete the file.");
    console.log();
    console.log("ARGUMENTS");
    console.log();
    console.log("  uri          Redis endpoint. (e.g., redis://example.com:6379)");
    console.log("  key          Key of list in Redis to which entry is added.");
    console.log("  ref          Source reference for file.");
    console.log("  file         File to drop.");
    console.log();
    console.log("OPTIONS");
    console.log();
    console.log("  --help       Show this help.");
}
