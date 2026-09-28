export type GameSession = {
  id: string;
  name: string;
  startsAt: string;
  numberOfTeams: number;
  participantCount: number;
  createdAt: string;
  sportsGroupId: string;
};

export type CreateGameSessionRequest = {
  name: string;
  startsAt: string;
  numberOfTeams: number;
  playerIds: string[];
};

export type UpdateGameSessionRequest = {
  name: string;
  startsAt: string;
};