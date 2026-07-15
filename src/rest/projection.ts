/** A string-keyed entity field that can be requested in a projection. */
export type OneRosterRestEntityField<TEntity> = Extract<keyof TEntity, string>;

/** A collection query with its projection field removed. */
export type OneRosterRestQueryWithoutFields<
  TQuery extends { readonly fields?: ReadonlyArray<string> },
> = Omit<TQuery, "fields">;

/** Collection options for a read that does not request a projection. */
export type OneRosterRestCollectionOptions<
  TQuery extends { readonly fields?: ReadonlyArray<string> },
> = {
  readonly query?: OneRosterRestQueryWithoutFields<TQuery>;
  readonly signal?: AbortSignal;
};

/** Collection options with a compile-time checked entity projection. */
export type OneRosterRestCollectionProjectionOptions<
  TEntity,
  TQuery extends { readonly fields?: ReadonlyArray<string> },
  TField extends OneRosterRestEntityField<TEntity>,
> = {
  readonly query: OneRosterRestQueryWithoutFields<TQuery> & {
    readonly fields: ReadonlyArray<TField>;
  };
  readonly signal?: AbortSignal;
};

/** Singleton options for a read that does not request a projection. */
export type OneRosterRestSingletonOptions = {
  readonly query?: { readonly fields?: never };
  readonly signal?: AbortSignal;
};

/** Singleton options with a compile-time checked entity projection. */
export type OneRosterRestSingletonProjectionOptions<
  TEntity,
  TField extends OneRosterRestEntityField<TEntity>,
> = {
  readonly query: { readonly fields: ReadonlyArray<TField> };
  readonly signal?: AbortSignal;
};
