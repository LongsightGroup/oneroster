import { describe, expect, it } from "vitest";

import { parseCsv, parseCsvBytes } from "../src/index.js";

describe("parseCsv", () => {
  it("parses quoted commas and escaped quotes", () => {
    const result = parseCsv('sourcedId,title\nc1,"English, Grade 7"\nc2,"He said ""hi"""\nc3,""');

    expect(result).toEqual({
      _tag: "ok",
      value: {
        rows: [
          ["sourcedId", "title"],
          ["c1", "English, Grade 7"],
          ["c2", 'He said "hi"'],
          ["c3", ""],
        ],
      },
    });
  });

  it("parses apostrophes and tabs as ordinary field content", () => {
    const result = parseCsv(
      "sourcedId,name,note\nu1,O'Connor,\tleading tab\nu2,\"Tab\tInside\",it's ok",
    );

    expect(result).toEqual({
      _tag: "ok",
      value: {
        rows: [
          ["sourcedId", "name", "note"],
          ["u1", "O'Connor", "\tleading tab"],
          ["u2", "Tab\tInside", "it's ok"],
        ],
      },
    });
  });

  it("parses CRLF line endings and files without a final newline", () => {
    const result = parseCsv("sourcedId,title\r\nc1,Algebra\r\nc2,Geometry");

    expect(result).toEqual({
      _tag: "ok",
      value: {
        rows: [
          ["sourcedId", "title"],
          ["c1", "Algebra"],
          ["c2", "Geometry"],
        ],
      },
    });
  });

  it("parses leading, trailing, and consecutive empty fields", () => {
    const result = parseCsv("a,b,c\n,leading,\ntrailing,,\n,,");

    expect(result).toEqual({
      _tag: "ok",
      value: {
        rows: [
          ["a", "b", "c"],
          ["", "leading", ""],
          ["trailing", "", ""],
          ["", "", ""],
        ],
      },
    });
  });

  it("parses an empty document as zero rows", () => {
    const result = parseCsv("");

    expect(result).toEqual({
      _tag: "ok",
      value: {
        rows: [],
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

  it("rejects invalid UTF-8 bytes", () => {
    const result = parseCsvBytes(new Uint8Array([0xff]));

    expect(result).toEqual({
      _tag: "err",
      error: {
        _tag: "CsvParseDiagnostic",
        code: "csv.invalid_utf8",
        message: "CSV file is not valid UTF-8.",
        rowNumber: 1,
        columnNumber: 1,
      },
    });
  });

  it("rejects unescaped quotes inside unquoted fields", () => {
    const result = parseCsv('sourcedId,title\nc1,bad"quote');

    expect(result).toMatchObject({
      _tag: "err",
      error: {
        code: "csv.unescaped_quote",
        rowNumber: 2,
        columnNumber: 7,
      },
    });
  });

  it("rejects characters after closing quotes", () => {
    const result = parseCsv('sourcedId,title\nc1,"ok"x');

    expect(result).toMatchObject({
      _tag: "err",
      error: {
        code: "csv.unexpected_character_after_quote",
        rowNumber: 2,
        columnNumber: 8,
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

  it("rejects bare carriage returns", () => {
    const result = parseCsv("sourcedId,title\rc1,Algebra");

    expect(result).toMatchObject({
      _tag: "err",
      error: {
        code: "csv.bare_carriage_return",
        rowNumber: 1,
        columnNumber: 16,
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
