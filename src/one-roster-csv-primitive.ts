declare const oneRosterGuidSymbol: unique symbol;
declare const oneRosterDateSymbol: unique symbol;
declare const oneRosterDateTimeSymbol: unique symbol;
declare const oneRosterYearSymbol: unique symbol;

/** OneRoster GUID value after CSV binding character and length validation. */
export type OneRosterGuid = string & { readonly [oneRosterGuidSymbol]: "OneRosterGuid" };

/** OneRoster Date value in exact YYYY-MM-DD form after validation. */
export type OneRosterDate = string & { readonly [oneRosterDateSymbol]: "OneRosterDate" };

/** OneRoster UTC DateTime value in exact YYYY-MM-DDTHH:MM:SS.sssZ form after validation. */
export type OneRosterDateTime = string & {
  readonly [oneRosterDateTimeSymbol]: "OneRosterDateTime";
};

/** OneRoster Year value in exact YYYY form after validation. */
export type OneRosterYear = string & { readonly [oneRosterYearSymbol]: "OneRosterYear" };

const guidPattern = /^[0-9A-Za-z./@_-]{1,255}$/u;
const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/u;
const dateTimePattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/u;
const yearPattern = /^\d{4}$/u;

/** Parse a string into a OneRoster GUID, returning undefined when the value is not valid. */
export function parseOneRosterGuid(input: string): OneRosterGuid | undefined {
  if (!guidPattern.test(input)) {
    return undefined;
  }

  // SAFETY: The regex enforces the OneRoster GUID length and permitted character set.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return input as OneRosterGuid;
}

/** Parse a string into a OneRoster Date, returning undefined when the value is not valid. */
export function parseOneRosterDate(input: string): OneRosterDate | undefined {
  if (!isValidDateText(input)) {
    return undefined;
  }

  // SAFETY: The date parser enforces exact YYYY-MM-DD shape and calendar validity.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return input as OneRosterDate;
}

/** Parse a string into a OneRoster UTC DateTime, returning undefined when invalid. */
export function parseOneRosterDateTime(input: string): OneRosterDateTime | undefined {
  const match = dateTimePattern.exec(input);

  if (match === null) {
    return undefined;
  }

  const year = parseMatchedInteger(match, 1);
  const month = parseMatchedInteger(match, 2);
  const day = parseMatchedInteger(match, 3);
  const hour = parseMatchedInteger(match, 4);
  const minute = parseMatchedInteger(match, 5);
  const second = parseMatchedInteger(match, 6);

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined ||
    second === undefined ||
    !isValidDateParts(year, month, day) ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return undefined;
  }

  // SAFETY: The parser enforces exact UTC DateTime shape, calendar validity, and time ranges.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return input as OneRosterDateTime;
}

/** Parse a string into a OneRoster Year, returning undefined when the value is not valid. */
export function parseOneRosterYear(input: string): OneRosterYear | undefined {
  if (!yearPattern.test(input)) {
    return undefined;
  }

  // SAFETY: The regex enforces the exact OneRoster YYYY year form.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return input as OneRosterYear;
}

/** Parse a OneRoster true/false vocabulary token into a boolean. */
export function parseOneRosterBooleanToken(input: string): boolean | undefined {
  if (input === "true") {
    return true;
  }

  if (input === "false") {
    return false;
  }

  return undefined;
}

function isValidDateText(input: string): boolean {
  const match = datePattern.exec(input);

  if (match === null) {
    return false;
  }

  const year = parseMatchedInteger(match, 1);
  const month = parseMatchedInteger(match, 2);
  const day = parseMatchedInteger(match, 3);

  return (
    year !== undefined &&
    month !== undefined &&
    day !== undefined &&
    isValidDateParts(year, month, day)
  );
}

function parseMatchedInteger(match: RegExpExecArray, index: number): number | undefined {
  const value = match[index];

  if (value === undefined) {
    return undefined;
  }

  return Number.parseInt(value, 10);
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }

  return day <= daysInMonth(year, month);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  if (month === 4 || month === 6 || month === 9 || month === 11) {
    return 30;
  }

  return 31;
}

function isLeapYear(year: number): boolean {
  if (year % 400 === 0) {
    return true;
  }

  if (year % 100 === 0) {
    return false;
  }

  return year % 4 === 0;
}
