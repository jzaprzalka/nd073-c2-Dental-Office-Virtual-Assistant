import { readFile, writeFile } from 'node:fs/promises';

const inputPath = process.argv[2];
const outputPath = process.argv[3] || 'appsettings.json';

if (!inputPath) {
    console.error('Usage: node scripts/env-to-appsettings.mjs <env-file> [output-json]');
    process.exit(1);
}

const entries = [];

const envText = await readFile(inputPath, 'utf8');
for (const rawLine of envText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator < 1) continue;

    const name = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
    ) {
        value = value.slice(1, -1);
    }

    entries.push({
        name,
        value,
        slotSetting: false
    });
}

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
console.log(`Wrote ${entries.length} settings to ${outputPath}`);
