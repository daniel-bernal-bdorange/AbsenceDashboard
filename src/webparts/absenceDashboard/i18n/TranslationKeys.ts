import type { resources } from './resources';

type Resources = typeof resources;
type KeysOfType<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T];

export type TranslationKeys = {
  common: KeysOfType<Resources['es']['common'], string>;
  dashboard: KeysOfType<Resources['es']['dashboard'], string>;
  filters: KeysOfType<Resources['es']['filters'], string>;
  charts: KeysOfType<Resources['es']['charts'], string>;
  table: KeysOfType<Resources['es']['table'], string>;
  absenceTypes: KeysOfType<Resources['es']['absenceTypes'], string>;
  errors: KeysOfType<Resources['es']['errors'], string>;
};

export type TranslationKey<T extends keyof TranslationKeys> = TranslationKeys[T];