import { describe, expect, it } from "vitest";

import { parseCsv, writeCsv, writeCsvBytes } from "../src/index.js";

const textDecoder = new TextDecoder();

describe("writeCsv", () => {
  it("serializes RFC 4180 cells while preserving ordinary content", () => {
    const result = writeCsv([
      ["plain", "comma, value", 'quote "value"', "O'Connor", "\tTabbed", " leading ", "café", ""],
      ["", "already ok", 'two "quotes"', "tail space ", "tab\tinside", 'quote, and "comma"'],
    ]);

    expect(result).toEqual({
      _tag: "ok",
      value:
        'plain,"comma, value","quote ""value""",O\'Connor,\tTabbed, leading ,café,\n' +
        ',already ok,"two ""quotes""",tail space ,tab\tinside,"quote, and ""comma"""',
    });

    if (result._tag === "err") {
      throw new Error("Expected CSV write to succeed.");
    }

    expect(parseCsv(result.value)).toEqual({
      _tag: "ok",
      value: {
        rows: [
          [
            "plain",
            "comma, value",
            'quote "value"',
            "O'Connor",
            "\tTabbed",
            " leading ",
            "café",
            "",
          ],
          ["", "already ok", 'two "quotes"', "tail space ", "tab\tinside", 'quote, and "comma"'],
        ],
      },
    });
  });

  it("writes UTF-8 bytes", () => {
    const result = writeCsvBytes([
      ["sourcedId", "title"],
      ["c1", "Café"],
    ]);

    expect(result._tag).toBe("ok");

    if (result._tag === "err") {
      throw new Error("Expected CSV byte write to succeed.");
    }

    expect(textDecoder.decode(result.value)).toBe("sourcedId,title\nc1,Café");
  });

  it("supports CRLF line endings", () => {
    expect(writeCsv([["a"], ["b"]], { lineEnding: "\r\n" })).toEqual({
      _tag: "ok",
      value: "a\r\nb",
    });
  });

  it("rejects embedded line breaks because the parser rejects them", () => {
    expect(writeCsv([["sourcedId"], ["bad\nvalue"]])).toEqual({
      _tag: "err",
      error: {
        _tag: "CsvWriteDiagnostic",
        code: "csv.field_line_break",
        message: "OneRoster CSV writer does not allow embedded field line breaks.",
        rowNumber: 2,
        columnNumber: 1,
      },
    });
  });
});
