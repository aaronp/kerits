/**
 * Identity Module Exports
 *
 * Clean exports for easy integration with KERITS.
 * All components and utilities are reusable.
 */

// Types
export type { MeritsUser, IdentityProvider } from './types';

// Identity Manager
export { SimpleIdentityManager, identityManager } from './simple-identity';

// Store
export { useIdentity } from '../../store/identity';

// Components (exported from components/ for easier discovery)
export { WelcomeScreen } from '../../components/WelcomeScreen';
export { UserSwitcher } from '../../components/UserSwitcher';
