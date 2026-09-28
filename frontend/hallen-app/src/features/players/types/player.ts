export type Player = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  sportsGroupId: string;
};

export type CreatePlayerRequest = {
  name: string;
};

export type UpdatePlayerRequest = {
  name: string;
  isActive: boolean;
};