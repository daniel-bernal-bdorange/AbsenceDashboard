const readValue = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
};

export const appEnv = {
  appTitle: readValue(import.meta.env.VITE_APP_TITLE, 'Absence Dashboard'),
};
