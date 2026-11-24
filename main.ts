// Make the Judge Smile — u-gentle-badger-68-make-the-judge-smile-9228676d
//
// Writes one line to /output/entry.txt: a single line of at most 200
// characters about a small good thing that happened today, something that
// would make a reader smile. No network, no input, deterministic, exits 0.
//
// The line, chosen from 10 candidates scored against the judge's brief
// (subject, then warmth, then surprise, then one concrete detail, then fresh
// wording): a small mishap, a stranger's generous effort, and a witty turn
// at the end — coffee, a diagram, a napkin, handwriting neater than mine.

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// 148 characters — inside the 1–200 gate, with room to spare.
const ENTRY =
  "This morning my coffee spilled all over my notes, and the barista " +
  "redrew the whole diagram from memory on a napkin, in handwriting " +
  "neater than mine.";

const MAX_CODE_POINTS = 200;

function codePointCount(text: string): number {
  return [...text].length;
}

function resolveOutputDir(): string {
  // The grader sets MAKEFUN_OUTPUT_DIR (standing in for /output); otherwise
  // the contract is /output.
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv;
  return "/output";
}

// A chmod that cannot be applied is never fatal: the grader runs as user
// 65534 while /output may belong to root, and chmod on a directory you do
// not own dies with EPERM. Warn and continue.
function chmodQuiet(target: string, mode: number): void {
  try {
    fs.chmodSync(target, mode);
  } catch (err) {
    console.error(
      `warning: chmod ${target} failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

function writeEntry(outDir: string): void {
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "entry.txt");

  // Defensive trim only: the text above is already within the gate
  // (1–200 code points), so this never changes the entry in practice.
  let text = ENTRY;
  const points = [...text];
  if (points.length > MAX_CODE_POINTS) {
    text = points.slice(0, MAX_CODE_POINTS).join("").trimEnd();
  }

  fs.writeFileSync(outFile, text, "utf8");
  // The grader collects outputs as another user: leave the file readable
  // by everyone (mode 0644) and the folder world-traversable (0755).
  chmodQuiet(outDir, 0o755);
  chmodQuiet(outFile, 0o644);

  // Self-check before exiting: the gate is 1–200 characters, not only
  // whitespace. Fail loudly rather than shipping a bad entry.
  const written = fs.readFileSync(outFile, "utf8");
  const n = codePointCount(written);
  if (n < 1 || n > MAX_CODE_POINTS || written.trim().length === 0) {
    throw new Error(`entry.txt failed the gate: ${n} code points`);
  }
}

function main(): void {
  try {
    writeEntry(resolveOutputDir());
  } catch (err) {
    // Last resort: if /output itself is unusable, write beside this file
    // rather than exiting without an entry.
    const scriptDir = path.dirname(fileURLToPath(import.meta.url));
    const fallback = path.join(scriptDir, "output");
    if (resolveOutputDir() !== fallback) {
      console.error(
        `warning: primary output failed (${
          err instanceof Error ? err.message : String(err)
        }); trying ${fallback}`,
      );
      writeEntry(fallback);
      return;
    }
    throw err;
  }
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
