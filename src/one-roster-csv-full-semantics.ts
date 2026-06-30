import type { OneRosterEnrollmentRelationshipIndexes } from "./one-roster-csv-enrollment-indexes.js";
import type { OneRosterCsvPackageDiagnostic } from "./one-roster-csv-package-diagnostic.js";
import type { OneRosterCsvFullPackage } from "./one-roster-csv-full.js";
import type { OneRosterCsvGradebookReferenceIndexes } from "./one-roster-csv-gradebook-types.js";
import { buildOneRosterCsvFullSemanticContext } from "./one-roster-csv-full-semantic-context.js";
import { validateOneRosterCsvFullGradebookSemantics } from "./one-roster-csv-full-semantic-gradebook.js";
import { validateOneRosterCsvFullResourcesSemantics } from "./one-roster-csv-full-semantic-resources.js";
import { validateOneRosterCsvFullRosteringSemantics } from "./one-roster-csv-full-semantic-rostering.js";
import type { OneRosterCsvReferenceValidationMode } from "./one-roster-csv-record-reference-validation.js";
import type { OneRosterCsvResourcesReferenceIndexes } from "./one-roster-csv-resources-types.js";
import type { OneRosterCsvRosteringReferenceIndexes } from "./one-roster-csv-rostering-types.js";

/** Inputs required to run semantic checks across a fully typed OneRoster CSV package. */
export type OneRosterCsvFullSemanticValidationInput = {
  readonly packageValue: OneRosterCsvFullPackage;
  readonly rosteringIndexes: OneRosterCsvRosteringReferenceIndexes;
  readonly gradebookIndexes: OneRosterCsvGradebookReferenceIndexes;
  readonly resourcesIndexes: OneRosterCsvResourcesReferenceIndexes;
  readonly enrollmentIndexes: OneRosterEnrollmentRelationshipIndexes;
  readonly diagnostics: OneRosterCsvPackageDiagnostic[];
  readonly referenceMode: OneRosterCsvReferenceValidationMode;
};

/** Validate semantic constraints that require already typed records and lookup indexes. */
export function validateOneRosterCsvFullSemanticRules(
  input: OneRosterCsvFullSemanticValidationInput,
): void {
  const context = buildOneRosterCsvFullSemanticContext(input);

  validateOneRosterCsvFullRosteringSemantics(context);
  validateOneRosterCsvFullGradebookSemantics(context);
  validateOneRosterCsvFullResourcesSemantics(context);
}
