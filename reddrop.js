#!/usr/bin/env node

const {readFile} = require("fs");
const {basename} = require("path");
const Redis = require("redis");
const fail = require("@zingle/fail");

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
        if (err) console.error(err);
        else console.log(`dropped file '${filename}'; ${result} pending`);

        redis.quit();
    });
});
