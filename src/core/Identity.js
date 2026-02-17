/**
 * Represents a unique identifier for a domain entity.
 * This is a base class for all entities that require a unique ID.
 */
export class Identity {
  /**
   * Creates an instance of Identity.
   * @param {string} value The unique identifier value.
   */
  constructor(value) {
    if (!value) {
      throw new Error("Identity value cannot be empty.");
    }
    this.value = value;
  }

  /**
   * Checks if this identity is equal to another.
   * @param {Identity} other The other identity to compare with.
   * @returns {boolean} True if the identities are equal, false otherwise.
   */
  equals(other) {
    if (!(other instanceof Identity)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Returns the string representation of the identity.
   * @returns {string} The identity value.
   */
  toString() {
    return this.value;
  }
}
