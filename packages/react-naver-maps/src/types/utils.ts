
type FilterFlags<Base, Condition> = {
  [Key in keyof Base]: Key extends Condition ? Key : never
};

export type AllowedKey<Base, Condition> = FilterFlags<Base, Condition>[keyof Base];
