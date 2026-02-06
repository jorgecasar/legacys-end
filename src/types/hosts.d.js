/**
 * @typedef {import('@lit/reactive-element').ReactiveControllerHost} ReactiveControllerHost
 * @typedef {import('../contexts/profile-context.js').Profile} Profile
 */

/**
 * Profile Host Interface
 * Describes a component that hosts and displays a user profile.
 * Often used as a mixin base for components needing profile access.
 * @typedef {ReactiveControllerHost & { profile: Profile | null }} ProfileHost
 */

export {};
