/**
 * Represents a value object in the domain.
 * Value objects are immutable and their equality is based on their value, not identity.
 */
export class ValueObject {
  /**
   * Creates an instance of ValueObject.
   * Implementations should override the equals method and potentially provide a 'properties' getter.
   */
  constructor() {
    // Ensure subclasses are not instantiated directly
    if (new.target === ValueObject) {
      throw new TypeError("Cannot construct ValueObject instances directly. Use a subclass.");
    }
  }

  /**
   * Compares this value object with another.
   * Subclasses must implement this method.
   * @param {ValueObject} other The other value object to compare with.
   * @returns {boolean} True if the value objects are equal, false otherwise.
   */
  equals(other) {
    throw new Error("Method 'equals()' must be implemented.");
  }

  /**
   * Returns a string representation of the value object.
   * @returns {string} A string representation.
   */
  toString() {
    // Default to stringifying properties if available
    if (typeof this.properties === 'function') {
      return JSON.stringify(this.properties());
    }
    return JSON.stringify(this);
  }
}
