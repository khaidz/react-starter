export const Roles = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
} as const

export const Permissions = {
  REPORTS_VIEW:          'reports:view',
  UPLOAD_CREATE:         'upload:create',
  EXPORT_VIEW:           'export:view',
  SETTINGS_VIEW:         'settings:view',
  LOAN_APPLICATION_VIEW: 'loan_application:view',
  USERS_VIEW:            'users:view',
  WORKFLOW_CONFIG_VIEW:  'workflow_config:view',
} as const
