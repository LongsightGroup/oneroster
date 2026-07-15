/** A typed OneRoster v1.1 relationship reference. */
export interface OneRosterV1p1Reference<TType extends string = string> {
  readonly href: string;
  readonly sourcedId: string;
  readonly type: TType;
}
