#!/usr/bin/env node
// Pseudo-localizes Android strings.xml: node pseudo-localize.mjs <strings.xml> [--out <file>] | --self-test
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const MAP = { a: "á", e: "é", i: "í", o: "ö", u: "ü", A: "Å", E: "É", I: "Î", O: "Ø", U: "Ü" };

export function pseudo(text) {
  // Keep format placeholders (%1$s, %d, %@, {name}) and XML entities intact.
  const keep = /(%\d*\$?[sd@]|\{[^}]+\}|&[a-z]+;|\\n|\\')/g;
  const out = text.split(keep).map((part, i) => (i % 2 ? part : [...part].map((c) => MAP[c] ?? c).join(""))).join("");
  return `[${out}${"~".repeat(Math.ceil(text.length * 0.3))}]`;
}

export function pseudoXml(xml) {
  return xml.replace(/(<string\b(?![^>]*translatable="false")[^>]*>)([\s\S]*?)(<\/string>)/g, (_, open, body, close) => open + pseudo(body) + close);
}

const args = process.argv.slice(2);
if (args.includes("--self-test")) {
  const sample = '<string name="a">Hello %1$s, you have {count} items</string><string name="id" translatable="false">keep</string>';
  const got = pseudoXml(sample);
  if (!got.includes("Héllö %1$s") || !got.includes("{count}")) throw new Error("placeholder or accent handling broke");
  if (!got.includes(">keep<")) throw new Error("translatable=false was modified");
  if (pseudo("abcdefghij").length < 10 * 1.3) throw new Error("no expansion");
  console.log("pseudo-localize self-test OK");
} else if (args[0]) {
  const out = args.includes("--out") ? args[args.indexOf("--out") + 1] : "values-en-rXA/strings.xml";
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, pseudoXml(readFileSync(args[0], "utf8")));
  console.log(`wrote ${out}`);
} else console.log("usage: pseudo-localize.mjs <strings.xml> [--out file] | --self-test");
