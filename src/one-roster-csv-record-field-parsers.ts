import {
  packageDiagnostic,
  type OneRosterCsvPackageDiagnosticCode,
} from "./one-roster-csv-package-diagnostic.js";
import {
  parseOneRosterBooleanToken,
  parseOneRosterDate,
  parseOneRosterFloat,
  parseOneRosterGuid,
  parseOneRosterInteger,
  parseOneRosterYear,
  type OneRosterDate,
  type OneRosterFloat,
  type OneRosterGuid,
  type OneRosterInteger,
  type OneRosterYear,
} from "./one-roster-csv-primitive.js";
import type { OneRosterCsvRecordRowContext } from "./one-roster-csv-record-context.js";
import {
  readOneRosterCsvRecordCell,
  readPossiblyRequiredOneRosterCsvRecordCell,
  splitOneRosterCsvRecordList,
} from "./one-roster-csv-record-cell-access.js";
import {
  formatVocabularyExpected,
  type OneRosterCsvFieldRequiredness,
} from "./one-roster-csv-record-schema.js";
import type { OneRosterExtensionVocabularyToken } from "./one-roster-csv-record-types.js";
import { isExtensionVocabularyToken } from "./one-roster-csv-vocabulary.js";

/** Parse a OneRoster GUID field with requiredness diagnostics. */
export function parseGuidField(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
): OneRosterGuid | undefined {
  return parseValidatedPrimitiveField(context, field, requiredness, parseOneRosterGuid, {
    code: "row.invalid_guid",
    message: "OneRoster GUID values must be 1-255 permitted characters.",
    expected: "1-255 characters from 0-9 A-Z a-z . - _ / @",
  });
}

/** Parse a OneRoster Date field with requiredness diagnostics. */
export function parseDateField(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
): OneRosterDate | undefined {
  return parseValidatedPrimitiveField(context, field, requiredness, parseOneRosterDate, {
    code: "row.invalid_date",
    message: "OneRoster Date values must match YYYY-MM-DD.",
    expected: "YYYY-MM-DD",
  });
}

/** Parse a OneRoster Year field with requiredness diagnostics. */
export function parseYearField(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
): OneRosterYear | undefined {
  return parseValidatedPrimitiveField(context, field, requiredness, parseOneRosterYear, {
    code: "row.invalid_year",
    message: "OneRoster Year values must match YYYY.",
    expected: "YYYY",
  });
}

/** Parse a OneRoster true/false enumeration field with requiredness diagnostics. */
export function parseTrueFalseVocabularyField(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
): boolean | undefined {
  return parseValidatedPrimitiveField(context, field, requiredness, parseOneRosterBooleanToken, {
    code: "row.invalid_boolean",
    message: 'OneRoster true/false enumeration values must be "true" or "false".',
    expected: "true|false",
  });
}

/** Parse a OneRoster integer field with requiredness diagnostics. */
export function parseIntegerField(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
): OneRosterInteger | undefined {
  return parseValidatedPrimitiveField(context, field, requiredness, parseOneRosterInteger, {
    code: "row.invalid_integer",
    message: "OneRoster Integer values must be safe base-10 integers.",
    expected: "base-10 integer",
  });
}

/** Parse a OneRoster float field with requiredness diagnostics. */
export function parseFloatField(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
): OneRosterFloat | undefined {
  return parseValidatedPrimitiveField(context, field, requiredness, parseOneRosterFloat, {
    code: "row.invalid_float",
    message: "OneRoster Float values must be finite base-10 numbers.",
    expected: "finite base-10 number",
  });
}

export function parseVocabularyField<TValue extends string>(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
  allowedValues: readonly TValue[],
  allowExtension: true,
): TValue | OneRosterExtensionVocabularyToken | undefined;

export function parseVocabularyField<TValue extends string>(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
  allowedValues: readonly TValue[],
  allowExtension: false,
): TValue | undefined;

/** Parse a OneRoster vocabulary field with optional ext:* support. */
export function parseVocabularyField<TValue extends string>(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
  allowedValues: readonly TValue[],
  allowExtension: boolean,
): TValue | OneRosterExtensionVocabularyToken | undefined {
  const value = readPossiblyRequiredOneRosterCsvRecordCell(context, field, requiredness);

  if (value === undefined || value === "") {
    return undefined;
  }

  if (isAllowedVocabularyValue(value, allowedValues)) {
    return value;
  }

  if (allowExtension && isExtensionVocabularyToken(value)) {
    return value;
  }

  context.diagnostics.push(
    packageDiagnostic({
      code: "row.invalid_enum",
      message: "OneRoster vocabulary value is not permitted for this field.",
      fileName: context.table.fileName,
      rowNumber: context.row.rowNumber,
      field,
      expected: formatVocabularyExpected(allowedValues, allowExtension),
      actual: "invalid value",
    }),
  );
  return undefined;
}

export function parseVocabularyListField<TValue extends string>(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
  allowedValues: readonly TValue[],
  allowExtension: true,
): ReadonlyArray<TValue | OneRosterExtensionVocabularyToken> | undefined;

export function parseVocabularyListField<TValue extends string>(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
  allowedValues: readonly TValue[],
  allowExtension: false,
): ReadonlyArray<TValue> | undefined;

/** Parse a comma-delimited OneRoster vocabulary list field with optional ext:* support. */
export function parseVocabularyListField<TValue extends string>(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
  allowedValues: readonly TValue[],
  allowExtension: boolean,
): ReadonlyArray<TValue | OneRosterExtensionVocabularyToken> | undefined {
  const values = parseStringListField(context, field, requiredness);

  if (values === undefined) {
    return undefined;
  }

  const vocabularyValues: Array<TValue | OneRosterExtensionVocabularyToken> = [];
  let valid = true;

  for (const value of values) {
    if (isAllowedVocabularyValue(value, allowedValues)) {
      vocabularyValues.push(value);
      continue;
    }

    if (allowExtension && isExtensionVocabularyToken(value)) {
      vocabularyValues.push(value);
      continue;
    }

    valid = false;
    context.diagnostics.push(
      packageDiagnostic({
        code: "row.invalid_enum",
        message: "OneRoster vocabulary list item is not permitted for this field.",
        fileName: context.table.fileName,
        rowNumber: context.row.rowNumber,
        field,
        expected: formatVocabularyExpected(allowedValues, allowExtension),
        actual: "invalid list item",
      }),
    );
  }

  return valid ? vocabularyValues : undefined;
}

/** Parse a required string field, preserving the original CSV cell text. */
export function parseRequiredStringField(
  context: OneRosterCsvRecordRowContext,
  field: string,
): string | undefined {
  return readPossiblyRequiredOneRosterCsvRecordCell(context, field, "required");
}

/** Parse an optional string field, normalizing blank cells to undefined. */
export function parseOptionalStringField(
  context: OneRosterCsvRecordRowContext,
  field: string,
): string | undefined {
  const value = readOneRosterCsvRecordCell(context, field);

  if (value === undefined || value === "") {
    return undefined;
  }

  return value;
}

/** Parse a comma-delimited OneRoster string list field. */
export function parseStringListField(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
): ReadonlyArray<string> | undefined {
  const value = readPossiblyRequiredOneRosterCsvRecordCell(context, field, requiredness);

  if (value === undefined) {
    return undefined;
  }

  return splitOneRosterCsvRecordList(context, field, value, requiredness);
}

/** Parse subjects and subjectCodes while enforcing their positional pairing. */
export function parseSubjectLists(
  context: OneRosterCsvRecordRowContext,
):
  | { readonly subjects: ReadonlyArray<string>; readonly subjectCodes: ReadonlyArray<string> }
  | undefined {
  const subjects = parseStringListField(context, "subjects", "optional");
  const subjectCodes = parseStringListField(context, "subjectCodes", "optional");

  if (subjects === undefined || subjectCodes === undefined) {
    return undefined;
  }

  if (subjects.length !== subjectCodes.length) {
    context.diagnostics.push(
      packageDiagnostic({
        code: "row.invalid_list",
        message: "OneRoster subjects and subjectCodes must contain the same number of items.",
        fileName: context.table.fileName,
        rowNumber: context.row.rowNumber,
        field: "subjectCodes",
        expected: "one subjectCode for each subject in the same order",
        actual: "mismatched item counts",
      }),
    );
    return undefined;
  }

  return { subjects, subjectCodes };
}

/** Parse users.csv userIds values in the required {type:id} form. */
export function parseUserIdsField(
  context: OneRosterCsvRecordRowContext,
): ReadonlyArray<string> | undefined {
  const userIds = parseStringListField(context, "userIds", "optional");

  if (userIds === undefined) {
    return undefined;
  }

  for (const userId of userIds) {
    if (isTypedIdentifier(userId)) {
      continue;
    }

    context.diagnostics.push(
      packageDiagnostic({
        code: "row.invalid_list",
        message: "OneRoster userIds items must use the {type:id} form.",
        fileName: context.table.fileName,
        rowNumber: context.row.rowNumber,
        field: "userIds",
        expected: "comma-delimited {type:id} items",
        actual: "invalid list item",
      }),
    );
    return undefined;
  }

  return userIds;
}

/** Parse a comma-delimited OneRoster GUID list field. */
export function parseGuidListField(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
): ReadonlyArray<OneRosterGuid> | undefined {
  const values = parseStringListField(context, field, requiredness);

  if (values === undefined) {
    return undefined;
  }

  const guids: OneRosterGuid[] = [];
  let valid = true;

  for (const value of values) {
    const guid = parseOneRosterGuid(value);

    if (guid === undefined) {
      valid = false;
      context.diagnostics.push(
        packageDiagnostic({
          code: "row.invalid_guid",
          message: "OneRoster GUID list items must be 1-255 permitted characters.",
          fileName: context.table.fileName,
          rowNumber: context.row.rowNumber,
          field,
          expected: "comma-delimited GUID values",
          actual: "invalid list item",
        }),
      );
      continue;
    }

    guids.push(guid);
  }

  return valid ? guids : undefined;
}

function parseValidatedPrimitiveField<T>(
  context: OneRosterCsvRecordRowContext,
  field: string,
  requiredness: OneRosterCsvFieldRequiredness,
  parse: (value: string) => T | undefined,
  invalidDiagnostic: {
    readonly code: OneRosterCsvPackageDiagnosticCode;
    readonly message: string;
    readonly expected: string;
  },
): T | undefined {
  const value = readPossiblyRequiredOneRosterCsvRecordCell(context, field, requiredness);

  if (value === undefined || value === "") {
    return undefined;
  }

  const parsed = parse(value);

  if (parsed !== undefined) {
    return parsed;
  }

  context.diagnostics.push(
    packageDiagnostic({
      code: invalidDiagnostic.code,
      message: invalidDiagnostic.message,
      fileName: context.table.fileName,
      rowNumber: context.row.rowNumber,
      field,
      expected: invalidDiagnostic.expected,
      actual: "invalid value",
    }),
  );
  return undefined;
}

function isAllowedVocabularyValue<TValue extends string>(
  value: string,
  allowedValues: readonly TValue[],
): value is TValue {
  for (const allowedValue of allowedValues) {
    if (value === allowedValue) {
      return true;
    }
  }

  return false;
}

function isTypedIdentifier(value: string): boolean {
  if (!value.startsWith("{") || !value.endsWith("}")) {
    return false;
  }

  const inner = value.slice(1, -1);
  const separator = inner.indexOf(":");

  return separator > 0 && separator === inner.lastIndexOf(":") && separator < inner.length - 1;
}
