export type GameSession = {
  isClosed: boolean;
  id: string;
  name: string;
  startsAt: string;
  numberOfTeams: number;
  participantCount: number;
  createdAt: string;
  sportsGroupId: string;
};

export type CreateGameSessionRequest = {
  teamNames?: string[];
  name: string;
  startsAt: string;
  numberOfTeams: number;
  playerIds: string[];
};

export type UpdateGameSessionRequest = {
  name: string;
  startsAt: string;
};
