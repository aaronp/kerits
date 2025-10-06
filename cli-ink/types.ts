/**
 * Type definitions for the CLI application
 */

export type Screen =
  | 'main'
  | 'accounts'
  | 'accounts-create'
  | 'accounts-switch'
  | 'accounts-rotate'
  | 'accounts-export'
  | 'accounts-graph'
  | 'registries'
  | 'registries-list'
  | 'registries-add'
  | 'registries-export'
  | 'registries-acdcs'
  | 'acdcs-list'
  | 'acdcs-create'
  | 'acdcs-graph'
  | 'acdcs-export'
  | 'contacts'
  | 'contacts-list'
  | 'contacts-add'
  | 'schemas'
  | 'schemas-list'
  | 'schemas-create'
  | 'schemas-export'
  | 'schemas-import';

export interface MenuItem {
  label: string;
  screen?: Screen;
  action?: string;
}

export interface Breadcrumb {
  label: string;
  screen: Screen;
}

export interface AppState {
  currentScreen: Screen;
  breadcrumbs: Breadcrumb[];
  selectedAccount?: string;
  selectedRegistry?: string;
  accounts: string[];
  registries: Array<{ id: string; alias: string }>;
  contacts: Array<{ alias: string; aid: string }>;
  schemas: Array<{ id: string; name: string }>;
}
