export type GameMatchTeamResult = {
  gameTeamId: string;
  gameTeamName: string;
  score: number;
  players: GameMatchTeamPlayer[];
};

export type GameMatch = {
  id: string;
  gameSessionId: string;
  name: string;
  matchNumber: number;
  createdAt: string;
  finishedAt: string | null;
  teamResults: GameMatchTeamResult[];
};

export type GameMatchTeamPlayer = {
  playerId: string;
  playerName: string;
};

export type CreateGameMatchTeamResultRequest = {
  gameTeamId: string;
  score: number;
};

export type UpdateGameMatchTeamResultRequest = {
  gameTeamId: string;
  score: number;
};

export type CreateGameMatchRequest = {
  name?: string;
  teamResults: CreateGameMatchTeamResultRequest[];
};

export type UpdateGameMatchRequest = {
  name?: string;
  teamResults: UpdateGameMatchTeamResultRequest[];
};
