import { describe, expect, it } from "vitest";

import { parseOneRosterCsvRosteringZip } from "../src/index.js";
import { manifestCsv, zipPackage } from "./fixtures/one-roster-csv-package-fixtures.js";
import { expectRosteringOk } from "./fixtures/one-roster-csv-rostering-assertions.js";
import { coursesCsv, orgRow, orgsCsv } from "./fixtures/one-roster-csv-rostering-rows.js";

describe("parseOneRosterCsvRecordRow requiredScalars contract", () => {
  it("keeps rows when optional scalar fields are absent", () => {
    const result = parseOneRosterCsvRosteringZip(
      zipPackage({
        "manifest.csv": manifestCsv({
          modes: new Map([
            ["orgs.csv", "bulk"],
            ["courses.csv", "bulk"],
          ]),
        }),
        "orgs.csv": orgsCsv([orgRow({ sourcedId: "org-1" })]),
        "courses.csv": coursesCsv([
          ["course-1", "", "", "", "Algebra One", "", "9", "org-1", "Math", "MATH"],
        ]),
      }),
    );

    const packageValue = expectRosteringOk(result);

    expect(packageValue.courses).toHaveLength(1);
    expect(packageValue.courses[0]?.courseCode).toBeUndefined();
  });

  it("keeps rows when optional list fields are absent", () => {
    const result = parseOneRosterCsvRosteringZip(
      zipPackage({
        "manifest.csv": manifestCsv({
          modes: new Map([
            ["orgs.csv", "bulk"],
            ["courses.csv", "bulk"],
          ]),
        }),
        "orgs.csv": orgsCsv([orgRow({ sourcedId: "org-1" })]),
        "courses.csv": coursesCsv([
          ["course-1", "", "", "", "Algebra One", "ALG1", "", "org-1", "", ""],
        ]),
      }),
    );

    const packageValue = expectRosteringOk(result);

    expect(packageValue.courses).toHaveLength(1);
    expect(packageValue.courses[0]?.grades).toEqual([]);
    expect(packageValue.courses[0]?.subjects).toEqual([]);
    expect(packageValue.courses[0]?.subjectCodes).toEqual([]);
  });
});
