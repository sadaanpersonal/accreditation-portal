/**
 * Permission code constants — mirrors Core/Common/PermissionCodes.cs on the backend.
 * Used by the frontend to check hasPermission() and build conditional nav.
 */
export const PermissionCodes = {
  // Users
  UsersCreate:       "Users.Create",
  UsersView:         "Users.View",
  UsersUpdate:       "Users.Update",
  UsersDelete:       "Users.Delete",

  // Roles
  RolesManage:       "Roles.Manage",
  RolesView:         "Roles.View",

  // Logs
  LogsView:          "Logs.View",

  // Events
  EventsCreate:      "Events.Create",
  EventsView:        "Events.View",
  EventsUpdate:      "Events.Update",
  EventsDelete:      "Events.Delete",

  // Requests
  RequestsCreate:    "Requests.Create",
  RequestsViewAll:   "Requests.ViewAll",
  RequestsViewOwn:   "Requests.ViewOwn",
  RequestsReview:    "Requests.Review",
  RequestsBulkUpload:"Requests.BulkUpload",

  // Passes
  PassesView:        "Passes.View",
  PassesRevoke:      "Passes.Revoke",

  // Invitations
  InvitationsManage: "Invitations.Manage",
} as const;

export type PermissionCode = typeof PermissionCodes[keyof typeof PermissionCodes];
