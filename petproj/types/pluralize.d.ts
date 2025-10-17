// Minimal TypeScript declarations for the `pluralize` package.
// This avoids build-time errors when `@types/pluralize` is not installed.

declare module 'pluralize' {
  function pluralize(word: string, count?: number, inclusive?: boolean): string;

  namespace pluralize {
    function singular(word: string): string;
    function plural(word: string, count?: number, inclusive?: boolean): string;
    function isSingular(word: string): boolean;
    function isPlural(word: string): boolean;
    function addPluralRule(rule: string | RegExp, replacement: string): void;
    function addSingularRule(rule: string | RegExp, replacement: string): void;
    function addUncountableRule(word: string): void;
    function addIrregularRule(single: string, plural: string): void;
  }

  export = pluralize;
}
