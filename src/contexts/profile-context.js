import { createContext } from '@lit/context';

// Manages user identity and data loading state.
// Provides: name, role, loading (boolean), error (string), serviceName
export const profileContext = createContext(Symbol('profile-context'));
