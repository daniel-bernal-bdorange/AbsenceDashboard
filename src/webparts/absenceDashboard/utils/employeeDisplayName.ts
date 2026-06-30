export type EmployeeDisplayNames = Record<string, string>;

export function resolveEmployeeDisplayName(
  username: string,
  displayNames: EmployeeDisplayNames,
): string {
  return displayNames[username.toLowerCase()] ?? username;
}