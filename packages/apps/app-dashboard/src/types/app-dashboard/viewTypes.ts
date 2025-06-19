export enum AppViewType {
  APP_DETAILS = 'details',
  APP_VERSIONS = 'versions',
  APP_VERSION = 'version',
  APP_EDIT = 'edit',
  APP_DELETE = 'delete',
  APP_CREATE_VERSION = 'createVersion',
  APP_EDIT_VERSION = 'editVersion',
}

export type AppViewTypeString = `${AppViewType}`;
