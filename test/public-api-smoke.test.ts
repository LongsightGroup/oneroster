import { describe, expect, it } from "vitest";

import * as oneRoster from "../src/index.js";
import {
  diagnosticCodeExample,
  diagnosticLocationExample,
  manifestRowsExample,
  parseCsvExample,
  parseEntriesExample,
  parseRawPackageExample,
  recordProjectionExample,
  resultNarrowingExample,
  relationshipHelperExample,
  statusExample,
  tableHeaderExample,
  validateFullExample,
  validateFullEntriesExample,
  validateGradebookExample,
  validateResourcesExample,
  validateRosteringExample,
  writeCsvExample,
  writeFullExample,
  writeGradebookExample,
  writeRawPackageExample,
  writeResourcesExample,
  writeRosteringExample,
} from "./public-api-usage.js";
import { expectFullOk } from "./fixtures/one-roster-csv-full-assertions.js";
import { validBulkFullGraphZip } from "./fixtures/one-roster-csv-full-packages.js";
import { expectGradebookOk } from "./fixtures/one-roster-csv-gradebook-assertions.js";
import { validBulkGradebookGraphZip } from "./fixtures/one-roster-csv-gradebook-packages.js";
import { manifestCsv, zipPackage } from "./fixtures/one-roster-csv-package-fixtures.js";
import { expectResourcesOk } from "./fixtures/one-roster-csv-resources-assertions.js";
import { validBulkResourcesGraphZip } from "./fixtures/one-roster-csv-resources-packages.js";
import { expectRosteringOk } from "./fixtures/one-roster-csv-rostering-assertions.js";
import { validBulkGraphZip } from "./fixtures/one-roster-csv-rostering-packages.js";
import { expectOk } from "./fixtures/result-assertions.js";

describe("public API smoke tests", () => {
  it("imports the package root and uses Web-compatible byte inputs", () => {
    const bytes = zipPackage({
      "manifest.csv": manifestCsv(),
    });

    const parsed = oneRoster.parseOneRosterCsvZip(bytes);

    expect(oneRoster.packageStatus).toBe("planning");
    expect(parsed).toMatchObject({
      _tag: "ok",
      value: {
        tables: [],
      },
    });
  });

  it("writes CSV bytes without Node-only Buffer inputs", () => {
    const written = oneRoster.writeCsvBytes([
      ["sourcedId", "title"],
      ["c1", "Algebra"],
    ]);

    expect(expectOk(written)).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(expectOk(written))).toBe("sourcedId,title\nc1,Algebra");
  });

  it("exercises documented public API usage examples", () => {
    const rawPackageBytes = zipPackage({
      "manifest.csv": manifestCsv(),
    });
    const rosteringBytes = validBulkGraphZip();
    const gradebookBytes = validBulkGradebookGraphZip();
    const resourcesBytes = validBulkResourcesGraphZip();
    const fullBytes = validBulkFullGraphZip();

    const rawPackage = expectOk(parseRawPackageExample(rawPackageBytes));
    expect(
      expectOk(
        parseEntriesExample([
          { path: "manifest.csv", bytes: new TextEncoder().encode(manifestCsv()) },
        ]),
      ),
    ).toEqual(rawPackage);
    expect(expectOk(parseCsvExample("sourcedId,title\nline-item-1,Unit Quiz")).rows).toHaveLength(
      2,
    );
    expect(new TextDecoder().decode(expectOk(writeCsvExample()))).toContain("line-item-1");

    expect(validateRosteringExample(rosteringBytes)._tag).toBe("ok");
    expect(validateGradebookExample(gradebookBytes)._tag).toBe("ok");
    expect(validateResourcesExample(resourcesBytes)._tag).toBe("ok");
    expect(validateFullExample(fullBytes)._tag).toBe("ok");
    expect(validateFullEntriesExample(expectOk(oneRoster.readZipEntries(fullBytes)))._tag).toBe(
      "ok",
    );

    const rosteringPackage = expectRosteringOk(
      oneRoster.parseOneRosterCsvRosteringZip(rosteringBytes),
    );
    const gradebookPackage = expectGradebookOk(
      oneRoster.parseOneRosterCsvGradebookZip(gradebookBytes),
    );
    const resourcesPackage = expectResourcesOk(
      oneRoster.parseOneRosterCsvResourcesZip(resourcesBytes),
    );
    const fullPackage = expectFullOk(oneRoster.parseOneRosterCsvFullZip(fullBytes));
    const validatedFullPackage = expectOk(oneRoster.parseAndValidateOneRosterCsvFullZip(fullBytes));

    expect(expectOk(writeRawPackageExample(rawPackage))).toBeInstanceOf(Uint8Array);
    expect(expectOk(writeRosteringExample(rosteringPackage))).toBeInstanceOf(Uint8Array);
    expect(expectOk(writeGradebookExample(gradebookPackage))).toBeInstanceOf(Uint8Array);
    expect(expectOk(writeResourcesExample(resourcesPackage))).toBeInstanceOf(Uint8Array);
    expect(expectOk(writeFullExample(fullPackage))).toBeInstanceOf(Uint8Array);
    expect(manifestRowsExample(rawPackage)[0]).toEqual(["propertyName", "value"]);
    expect(tableHeaderExample()).toContain("enabledUser");
    expect(recordProjectionExample(fullPackage)).toContain("user-agent");
    expect(statusExample(fullPackage)).toBe("active:active");
    expect(relationshipHelperExample(validatedFullPackage)).toBeGreaterThan(0);
    expect(
      diagnosticLocationExample({
        _tag: "OneRosterCsvPackageDiagnostic",
        severity: "error",
        code: "row.invalid_boolean",
        message: "x",
        fileName: "users.csv",
        rowNumber: 2,
        field: "enabledUser",
      }),
    ).toBe("users.csv: row 2: field enabledUser");

    expect(
      diagnosticCodeExample({
        _tag: "OneRosterCsvPackageDiagnostic",
        severity: "error",
        code: "csv.unescaped_quote",
        message: "x",
      }),
    ).toBe("csv.unescaped_quote");
    expect(
      resultNarrowingExample(
        oneRoster.err({
          _tag: "CsvWriteDiagnostic",
          code: "csv.field_line_break",
          message: "x",
          rowNumber: 2,
          columnNumber: 1,
        }),
      ),
    ).toBe("csv.field_line_break");
    expect(resultNarrowingExample(oneRoster.ok("value"))).toBe("value");
  });
});
