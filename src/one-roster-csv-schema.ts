import type { OneRosterCsvDataFileName } from "./one-roster-csv-file.js";
import { gradebookTableHeaders } from "./one-roster-csv-gradebook-schema.js";
import { resourcesTableHeaders } from "./one-roster-csv-resources-schema.js";
import { rosteringTableHeaders } from "./one-roster-csv-rostering-schema.js";

export { gradebookTableHeaders } from "./one-roster-csv-gradebook-schema.js";
export { resourcesTableHeaders } from "./one-roster-csv-resources-schema.js";
export { rosteringTableHeaders } from "./one-roster-csv-rostering-schema.js";

/** Canonical corrected OneRoster CSV Binding 1.2.1 headers keyed by data file name. */
export const oneRosterCsvTableHeaders: Readonly<
  Record<OneRosterCsvDataFileName, readonly string[]>
> = {
  ...rosteringTableHeaders,
  ...gradebookTableHeaders,
  ...resourcesTableHeaders,
};
