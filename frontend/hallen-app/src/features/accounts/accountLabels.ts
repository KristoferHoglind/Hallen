export const groupRoleLabel = (role: string) =>
  ({ Owner: "Ägare", Admin: "Administratör", Member: "Medlem" })[role] ?? role;
