export type SportsGroupMemberRole = "Owner" | "Admin" | "Member";

export type SportsGroupMemberStatus =
  | "PendingApproval"
  | "Approved"
  | "Rejected"
  | "Disabled";

export type SportsGroupMember = {
  id: string;
  sportsGroupId: string;
  appUserId: string;
  displayName: string;
  role: SportsGroupMemberRole;
  status: SportsGroupMemberStatus;
  createdAt: string;
  approvedAt: string | null;
};

export type AddSportsGroupMemberRequest = {
  email: string;
  role: SportsGroupMemberRole;
};

export type UpdateSportsGroupMemberRoleRequest = {
  role: SportsGroupMemberRole;
};
