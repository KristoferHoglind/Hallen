export type GameSessionParticipant = {
  playerId: string;
  playerName: string;
  isAssignedToTeam: boolean;
  gameTeamId: string | null;
};

export type GameSessionTeam = {
  id: string;
  name: string;
  players: GameSessionParticipant[];
};

export type GameSessionSetup = {
  gameSessionId: string;
  gameSessionName: string;
  startsAt: string;
  sportsGroupId: string;
  participants: GameSessionParticipant[];
  teams: GameSessionTeam[];
};

export type MovePlayerToTeamRequest = {
  gameTeamId: string | null;
};