/* oxlint-disable import/no-nodejs-modules, eslint/no-console */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

import { unzipSync } from "fflate";

const referenceSet = {
  url: "https://www.imsglobal.org/sites/default/files/OneRoster/OneRosterv1p2CSV_Conformance_TestSet_20231112v1.zip",
  sha256: "700cdef00b053ca1b3753e29c4621c28e44235b410a550c7891eaa7842202450",
  expectedBulkCases: 350,
  expectedDeltaCases: 369,
};

const { parseAndValidateOneRosterCsvFullZip } = await import(
  new URL("../dist/index.js", import.meta.url)
);

const response = await fetch(referenceSet.url);
if (!response.ok) {
  throw new Error(
    `Unable to download the official OneRoster CSV reference set: HTTP ${response.status}.`,
  );
}

const archive = new Uint8Array(await response.arrayBuffer());
const digest = createHash("sha256").update(archive).digest("hex");
if (digest !== referenceSet.sha256) {
  throw new Error(`Official OneRoster CSV reference set digest mismatch: ${digest}.`);
}

await mkdir(new URL("../.specs/oneroster-csv/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../.specs/oneroster-csv/rostering-reference.zip", import.meta.url),
  archive,
);

const entries = unzipSync(archive);
const cases = Object.entries(entries)
  .filter(
    ([name]) =>
      name.endsWith(".zip") &&
      (name.includes("/ValidFileSet/Rostering/") || name.includes("/InvalidFileSet/Rostering/")),
  )
  .map(([name, bytes]) => ({
    name,
    bytes,
    expected: name.includes("/ValidFileSet/") ? "ok" : "err",
    mode: /\/[VI]R[bB][^/]*\.zip$/u.test(name) ? "bulk" : "delta",
  }))
  .toSorted((left, right) => left.name.localeCompare(right.name));

const bulkCases = cases.filter((testCase) => testCase.mode === "bulk").length;
const deltaCases = cases.filter((testCase) => testCase.mode === "delta").length;
if (
  bulkCases !== referenceSet.expectedBulkCases ||
  deltaCases !== referenceSet.expectedDeltaCases
) {
  throw new Error(
    `Official Rostering case inventory mismatch: bulk=${bulkCases}, delta=${deltaCases}.`,
  );
}

const failures = [];
for (const testCase of cases) {
  const result = parseAndValidateOneRosterCsvFullZip(testCase.bytes, {
    referenceMode: "allRows",
  });

  if (result._tag === testCase.expected) {
    continue;
  }

  const id = testCase.name.slice(testCase.name.lastIndexOf("/") + 1, -4);
  const codes = result._tag === "err" ? result.error.map((diagnostic) => diagnostic.code) : [];
  failures.push(
    `${id}: expected ${testCase.expected}, received ${result._tag} [${codes.join(", ")}]`,
  );
}

console.log(
  `Official OneRoster 1.2.1 Rostering CSV reference set: sha256=${digest} bulk=${bulkCases} delta=${deltaCases}.`,
);
if (failures.length > 0) {
  console.error(`Rostering CSV conformance failed for ${failures.length} case(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Rostering CSV conformance passed for all ${cases.length} official cases.`);
}
