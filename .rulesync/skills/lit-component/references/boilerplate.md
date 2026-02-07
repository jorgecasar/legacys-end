# Lit Component Boilerplate

### 1. Styles File (`MyComponent.styles.js`)

```javascript
import { css } from "lit";

export const myComponentStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
  }
`;
```

### 2. Logic File (`MyComponent.js`)

```javascript
import { SignalWatcher } from "@lit-labs/signals";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { myComponentStyles } from "./MyComponent.styles.js";

/**
 * @element my-component
 */
@customElement("my-component")
export class MyComponent extends SignalWatcher(LitElement) {
  static styles = myComponentStyles;

  /** @type {string} */
  @property({ type: string }) 
  accessor title = "";

  @state() 
  accessor _isActive = false;

  render() {
    return html`
      <div>
        <h1>${this.title}</h1>
        <slot></slot>
      </div>
    `;
  }
}
```
