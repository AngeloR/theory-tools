import { mkdir, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "CHANGELOG.md");
const destination = resolve(root, "public", "CHANGELOG.md");

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
