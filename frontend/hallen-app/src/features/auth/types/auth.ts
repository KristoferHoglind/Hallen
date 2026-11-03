export type UserAccountStatus = "Active" | "Disabled";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  isSysAdmin: boolean;
  canCreateGroups: boolean;
  status: UserAccountStatus;
};

export type RegisterRequest = {
  invitationToken?: string;
  email: string;
  displayName: string;
  password: string;
};

export type LoginRequest = {
  twoFactorCode?: string;
  recoveryCode?: boolean;
  email: string;
  password: string;
};
