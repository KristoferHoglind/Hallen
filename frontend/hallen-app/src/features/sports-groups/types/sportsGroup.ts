export type SportsGroupRole = "Owner" | "Admin" | "Member";

export type SportsGroup = {
  id: string;
  name: string;
  createdAt: string;
  currentUserRole: SportsGroupRole | "";
  canManage: boolean;
  isOwner: boolean;
};

export type CreateSportsGroupRequest = {
  name: string;
};

export type UpdateSportsGroupRequest = {
  name: string;
};