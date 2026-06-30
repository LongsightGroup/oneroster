import { describe, expect, it } from "vitest";

import { parseCsv, parseCsvBytes } from "../src/index.js";

describe("parseCsv", () => {
  it("parses quoted commas and escaped quotes", () => {
    const result = parseCsv('sourcedId,title\nc1,"English, Grade 7"\nc2,"He said ""hi"""');

    expect(result).toEqual({
      _tag: "ok",
      value: {
        rows: [
          ["sourcedId", "title"],
          ["c1", "English, Grade 7"],
          ["c2", 'He said "hi"'],
        ],
      },
    });
  });

  it("tolerates a UTF-8 BOM prefix", () => {
    const result = parseCsvBytes(new TextEncoder().encode("\uFEFFsourcedId\nu1"));

    expect(result).toEqual({
      _tag: "ok",
      value: {
        rows: [["sourcedId"], ["u1"]],
      },
    });
  });

  it("rejects unclosed quoted fields with location context", () => {
    const result = parseCsv('sourcedId,title\nc1,"English', { fileName: "classes.csv" });

    expect(result).toEqual({
      _tag: "err",
      error: {
        _tag: "CsvParseDiagnostic",
        code: "csv.unclosed_quote",
        message: "CSV quoted field was not closed.",
        fileName: "classes.csv",
        rowNumber: 2,
        columnNumber: 12,
      },
    });
  });

  it("rejects embedded line breaks inside quoted fields for OneRoster CSV", () => {
    const result = parseCsv('sourcedId,title\nc1,"English\nGrade 7"');

    expect(result).toMatchObject({
      _tag: "err",
      error: {
        code: "csv.line_break_in_quoted_field",
        rowNumber: 2,
        columnNumber: 12,
      },
    });
  });
});
