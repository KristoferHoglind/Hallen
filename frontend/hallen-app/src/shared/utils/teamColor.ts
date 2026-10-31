const teamColors = [
  "#2563eb",
  "#b45309",
  "#7c3aed",
  "#0e7490",
  "#be185d",
  "#4d7c0f",
];

// Use the team's ID so its colour stays the same when renamed or reordered.
export function teamColor(teamId: string) {
  let hash = 0;
  for (const character of teamId)
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return teamColors[hash % teamColors.length];
}
