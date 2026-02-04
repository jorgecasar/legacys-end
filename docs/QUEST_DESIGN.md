# 📜 Legacy's End - Quest Design Bible

> "To fix the world, you must first fix the code."

This document serves as the **Master Plan** for all Quests in Legacy's End. It connects the narrative (Lore) with the technical skills (Tech) and provides concrete examples for creating future chapters.

---

## 🧭 Design Philosophy

Every Quest follows a strict **"Refactoring Ark"**:
1.  **The Broken World (Legacy)**: The player encounters code that works but is fragile, coupled, or unmaintainable.
2.  **The Revelation (Concept)**: Alarion (the player) learns a new pattern (Signals, DI, Shadow DOM).
3.  **The Transformation (Refactor)**: The player implements the pattern, fixing the code and "healing" the game world.

---

## 🗺️ Quest Registry & Roadmap

### 1. 🛡️ The Aura of Sovereignty (Encapsulation)
**Focus:** Web Components, Shadow DOM, CSS Isolation.
**Status:** ✅ Playable

*   **Scenario (Flavor):** **The Toxic Swamp**. A bubbling, chaotic mire where everything is stained by "Global Pollution" (pink/red slime).
*   **NPC:** **The Shield-Smith**. A hermit living in a hermetically sealed bubble. *Dialogue*: "Without boundaries, we are but soup."
*   **Legacy Code ("The Problem"):**
    ```css
    /* global.css */
    .btn { background: red !important; } /* Bleeds into everything */
    ```
    ```javascript
    // Component without Shadow DOM
    this.innerHTML = `<button class="btn">Click</button>`;
    ```
*   **The Refactor ("The Goal"):**
    ```javascript
    // Isolated Shadow DOM
    static styles = css`button { background: blue; }`; // Safe
    render() { return html`<button>Safe</button>`; }
    ```
*   **Reward:** **Badge of the Bubble**. Ability: "Style Immunity" - The hero no longer turns pink when walking through global CSS slime.
*   **Chapter Roadmap:**
    1.  **"The Bleeding Styles"**: Identify why the Hero's armor is pink (global CSS leak).
    2.  **"Raising the Shield"**: Attach ShadowRoot to a component.
    3.  **"The Leak"**: A global style `* { box-sizing: content-box }` is ruining layout. **Task**: Reset box-sizing inside Shadow DOM.
    4.  **"The Slot Machine"**: Learn to use `<slot>` to project content instead of parsing `innerHTML`.
    5.  **"The Phantom Event"**: Events are not bubbling out of Shadow DOM. **Task**: Use `composed: true`.

---

### 2. 🔮 The Orb of Inquiry (Dependency Injection)
**Focus:** Clean Architecture, Dependency Injection (DI), Lit Context.
**Status:** ✅ Playable

*   **Scenario (Flavor):** **The Chain Gang Prison**. Characters are physically chained to heavy anvils labeled "Database" or "Network".
*   **NPC:** **The Liberator**. A rogue who picks locks (dependencies). *Dialogue*: "Why carry the world when you can ask the Context to carry it for you?"
*   **Legacy Code:**
    ```javascript
    import { userService } from '../services/global-service.js'; // Hard coupling
    ```
*   **The Refactor**:
    - Decouple services using the standardized [Context Usage Patterns](PROJECT_STANDARDS.md#context-usage-patterns).

*   **Reward:** **The Ghost Key**. Ability: "Summon Service" - Can invoke tools without carrying them.
*   **Chapter Roadmap:**
    1.  **"The Hard Link"**: Try to test a component that imports a database directly (fails).
    2.  **"The Context Ritual"**: Create a Provider and Consumer to decouple them.
    3.  **"The Hidden Singleton"**: Remove a `window.GameManager` global and replace with a Context Provider.
    4.  **"The Mockingbird"**: Swap a real `AudioService` for a `MockAudioService` during a "stealth mission" (test).
    5.  **"The Prop Drill"**: Refactor a component chain `App -> Game -> Level -> Hero` passing `userData` to Context.

---

### 3. 💎 The Flowing Heartstone (Reactivity)
**Focus:** Lit Signals, Fine-Grained Reactivity, State Management.
**Status:** 🚧 Coming Soon

*   **Scenario (Flavor):** **The Stuttering Kingdom**. Time freezes randomly (lag) and people repeat sentences (re-renders).
*   **NPC:** **The Pulse Watcher**. A monk meditating on a single floating rock. *Dialogue*: "Do not shout to the mountain. Whisper to the stone, and the mountain will move."
*   **Legacy Code:**
    ```javascript
    // Prop Drilling Hell
    <game-view .heroX=${this.x} .heroY=${this.y}></game-view>
    // Managers modifying DOM directly
    document.querySelector('#hero').style.left = '10px';
    ```
*   **The Refactor:**
    ```javascript
    // Signal Service
    heroPos = new Signal.State({ x: 0, y: 0 });
    // Component
    render() { return html`x: ${this.service.heroPos.get().x}`; } // Updates automatically
    ```
*   **Reward:** **The Synced Heart**. Ability: "Flow State" - Movement becomes perfectly smooth (60fps).
*   **Chapter Roadmap:**
    1.  **"The Stuttering Step"**: Fix performance issues caused by re-rendering the whole map on every step.
    2.  **"The Single Pulse"**: Replace a `CustomEvent` chain with a single Signal.
    3.  **"The Zombie View"**: A component updates even when off-screen. **Task**: Use `SignalWatcher` to only subscribe when connected.
    4.  **"The Infinite Loop"**: A signal effect triggers itself. **Task**: Break the cycle using `untrack()` or better signal derivation.
    5.  **"The Derived Truth"**: Create a `computed` signal (`score = coins * 10`) instead of manually updating two variables.

---

### 4. 🎨 The Chromatic Loom (Design Tokens)
**Focus:** CSS Variables, Theming, Design Systems.
**Status:** 🚧 Coming Soon

*   **Scenario (Flavor):** **The Monochrome Grey-Lands**. A world drained of color, flat and lifeless.
*   **NPC:** **The Weaver of Light**. A spider-like entity spinning threads of pure RGB. *Dialogue*: "Color is not paint. It is a value passed by reference."
*   **Legacy Code:**
    ```css
    .card { background-color: #ffffff; color: #000000; } /* Hardcoded */
    ```
*   **The Refactor:**
    ```css
    .card {
      background-color: var(--surface-1);
      color: var(--text-1);
    }
    ```
*   **Reward:** **The Prism Cloak**. Ability: "Theme Shift" - Can toggle day/night cycles at will.
*   **Chapter Roadmap:**
    1.  **"The Hardcoded Sun"**: Replace hex codes with semantic tokens found in the "Loom".
    2.  **"The Night Shift"**: Implement a toggle that changes the token values, instantly theming the app.
    3.  **"The Contrast Checker"**: Dark mode makes text unreadable. **Task**: high-contrast tokens.
    4.  **"The Brand Swap"**: Change the game's font and radius globally by loading a different CSS variable file.
    5.  **"The Fluid Scale"**: Implement fluid typography (`clamp()`) using tokens.

---

### 5. 🛡️ The Watcher's Bastion (Security/Auth)
**Focus:** Route Guards, Centralized Auth, Session Management.
**Status:** 🚧 Coming Soon

*   **Scenario (Flavor):** **The Glass Fortress**. Walls are transparent, and thieves walk through walls because the doors are just painted on.
*   **NPC:** **The Gatekeeper (Gate Guard)**. A rigid, armored sentinel who demands papers. *Dialogue*: "Trust, but verify. Then verify again."
*   **Legacy Code:**
    ```javascript
    // In every component...
    if (!user.isLoggedIn) { window.location = '/login'; } // Repetitive & unsafe
    ```
*   **The Refactor:**
    ```javascript
    // Centralized Guard
    router.setGuard('/admin', () => authService.isLoggedIn.get());
    ```
*   **Reward:** **The Sigil of Identity**. Ability: "True Sight" - Can see hidden paths (Admin Routes) invisible to others.
*   **Chapter Roadmap:**
    1.  **"The Leaky Gate"**: Exploit a race condition to enter a restricted zone.
    2.  **"The Sentinel"**: Build a `ProtectedRoute` wrapper component.
    3.  **"The XSS Monster"**: Fix a vulnerability where user input is rendered with `.innerHTML`. **Task**: Use Lit's auto-escaping.
    4.  **"The Expired Token"**: Handle a 401 response gracefully without crashing.
    5.  **"The Role Player"**: Implement Role-Based Access Control (RBAC) (Admin vs. User views).

---

### 6. 👁️ The Crimson Altar (Error Handling)
**Focus:** Error Boundaries, Logging, Observability.
**Status:** 🚧 Coming Soon

*   **Scenario (Flavor):** **The Void Edges**. Places where the world geometry simply ends (crashes) into white nothingness.
*   **NPC:** **The Oracle of Crashes**. A blind seer who hears the screams of dying scripts. *Dialogue*: "A silent death is a tragedy. A logged error is a lesson."
*   **Legacy Code:**
    ```javascript
    try { doMagic(); } catch (e) { console.log(e); } // Swallowed error
    ```
*   **The Refactor:**
    ```javascript
    // Global Error Handler & UI Boundary
    window.addEventListener('error', (e) => logger.fatal(e));
    ```
*   **Reward:** **The Black Box**. Ability: "Resurrection" - The game doesn't restart on crash; it just rewinds a step.
*   **Chapter Roadmap:**
    1.  **"The Silent Crash"**: Debug a feature that fails silently.
    2.  **"The Altar's Record"**: Implement a Logger Service that captures the stack trace.
    3.  **"The 404 Void"**: Handle a missing asset without showing a broken image icon. **Task**: Image fallback.
    4.  **"The Retry Ritual"**: Implement exponential backoff for a failing network request.
    5.  **"The Boundary"**: Create an `<error-boundary>` component that catches rendering errors in children.

---

### 7. 🪞 The Mirror of Veracity (Testing)
**Focus:** Playwright, Visual Regression, Integration Tests.
**Status:** 🚧 Coming Soon

*   **Scenario (Flavor):** **The House of Mirrors**. Dozens of reflections of the Hero, but some do the opposite action (regressions).
*   **NPC:** **The Inspector**. A detective with a magnifying glass examining the reflections. *Dialogue*: "I believe only what I can prove."
*   **Legacy Code:**
    *   No tests. "It works on my machine."
*   **The Refactor:**
    ```javascript
    // Playwright Test
    test('hero moves right', async ({ page }) => {
      await page.keyboard.press('ArrowRight');
      await expect(hero).toHaveCSS('left', '100px');
    });
    ```
*   **Reward:** **The Golden Checkmark**. Ability: "Regression Repellent" - Auto-blocks bad commits.
*   **Chapter Roadmap:**
    1.  **"The Phantom Bug"**: A bug that keeps coming back. Write a test to kill it forever.
    2.  **"The Perfect Reflection"**: Set up a Visual Regression test for the UI.
    3.  **"The Flaky Ghost"**: Fix a test that fails 10% of the time (race condition).
    4.  **"The Accessibility Audit"**: Write a test that fails if `axe-core` finds violations.
    5.  **"The Network Mock"**: Use Playwright to intercept and mock network requests.

---

### 8. 📜 The Scroll of Tongues (i18n)
**Focus:** Internationalization, lit-localize, Fluent.
**Status:** 🚧 Coming Soon

*   **Scenario (Flavor):** **The Babel Ruins**. Signs are written in gibberish (placeholder keys like `TITLE_MAIN_MENU`).
*   **NPC:** **The Polyglot Bard**. A traveler who speaks in shifting subtitles. *Dialogue*: "To speak to one heart, you must speak their tongue."
*   **Legacy Code:**
    ```javascript
    render() { return html`<p>Hello World</p>`; }
    ```
*   **The Refactor:**
    ```javascript
    render() { return html`<p>${msg('Hello World')}</p>`; }
    ```
*   **Reward:** **The Rosetta Stone**. Ability: "Universal Speech" - All NPC text auto-translates to the user's locale.
*   **Chapter Roadmap:**
    1.  **"The Stone Tablets"**: Extract hardcoded strings into a resource file.
    2.  **"The Universal Translator"**: Implement the toggle to switch languages dynamically.
    3.  **"The Plural Hydra"**: Handle "1 item" vs "2 items" correctly in different languages.
    4.  **"The Date Formatter"**: Stop using `moment.js` and switch to `Intl.DateTimeFormat`.
    5.  **"The RTL Mirror"**: Support Right-to-Left layout (Arabic/Hebrew) using logical CSS properties (`margin-inline-start`).

---

### 9. 🦇 The Accessibility Echoes (A11y)
**Focus:** ARIA, Keyboard Nav, Semantics.
**Status:** 🚧 Coming Soon (New!)

*   **Scenario (Flavor):** **The Fog of Silence**. A thick fog where you can't see, only hear (screen reader focus).
*   **NPC:** **The Blind Guide**. A monk with a staff who moves confidently through the fog. *Dialogue*: "The eyes deceive. The structure is the truth."
*   **Legacy Code:**
    ```javascript
    // Div acting as button
    <div onclick="submit()">Submit</div> // Not focusable, no role
    ```
*   **The Refactor:**
    ```javascript
    <button aria-label="Submit Form" @click=${submit}>Submit</button>
    ```
*   **Reward:** **The Focus Ring**. Ability: "Sonar Sight" - Pressing Tab reveals the hidden skeleton of the page.
*   **Chapter Roadmap:**
    1.  **"The Invisible Maze"**: Navigate a menu that has no focus styles (`outline: none`). Fix the CSS.
    2.  **"The Echo"**: Add `aria-live` to the Quest Log so updates are announced.
    3.  **"The Trap"**: Fix a "Keyboard Trap" where the user tabs into a modal but can't tab out.
    4.  **"The Alt Text"**: Describe complex images (charts or game scenes) for screen readers.
    5.  **"The Semantic Button"**: Replace a `<div class="btn">` with a real `<button>`.

---

### 10. 🗣️ The Machine's Voice (AI & Speech)
**Focus:** Web Speech API, Local AI (Gemini Nano), Prompt Engineering.
**Status:** ✅ Playable

*   **Scenario (Flavor):** **The Whispering Caverns**. Echoes distort commands; only clear, intent-driven speech opens the gates.
*   **NPC:** **The Echo**. A digital construct that repeats only truth. *Dialogue*: "I do not hear your words, only your intent."
*   **Legacy Code:**
    ```javascript
    // Rigid Text Matching
    if (userInput === "go north") { moveInfoWith() } // Fails on "move north" or "walk up"
    ```
*   **The Refactor:**
    ```javascript
    // Context-Aware Intent Parsing
    const prompt = `Context: ${ctx}. User said: "${input}". Return JSON action.`;
    const action = await aiSession.prompt(prompt);
    // User says "Let's bounce" -> AI returns { action: "returnToHub" }
    ```
*   **Reward:** **The Silver Tongue**. Ability: "Command Override" - Use voice to control the game (Move, Interact, Debug).
*   **Chapter Roadmap:**
    1.  **"The Deaf Ear"**: Fix a browser permission error blocking the microphone.
    2.  **"The Parrot"**: Implement `speechSynthesis` to make the game talk back.
    3.  **"The Babel Fish"**: Use the AI Prompt API to translate "Run away!" into `move_hero({ x: -1 })`.
    4.  **"The Context Key"**: The AI fails to understand "Open current". **Task**: Inject `GameContext` into the prompt.
    5.  **"The Hallucination"**: Handle AI errors when it returns invalid JSON.

---

### 11. 🔄 The Hot Switch (Strategy Pattern)
**Focus:** API Migration, Feature Flags, Polymorphism.
**Status:** ✅ Playable

*   **Scenario (Flavor):** **The Glitch City**. Two realities overlap—a pixelated "Legacy" city and a high-res "New" city.
*   **NPC:** **The Bridge Builder**. Maintains the connection between the two worlds. *Dialogue*: "You cannot build the future by burning the bridge to the past."
*   **Legacy Code:**
    ```javascript
    // Hardcoded Service
    import api from './legacy-api.js';
    api.getUser();
    ```
*   **The Refactor:**
    ```javascript
    // Dynamic Strategy
    const service = useNewApi ? newApi : legacyApi;
    service.getUser();
    ```
*   **Reward:** **The Quantum Switch**. Ability: "Phase Shift" - Toggle between Legacy and Modern implementations at runtime.
*   **Chapter Roadmap:**
    1.  **"The Hard Dependency"**: Identify why the game crashes when the legacy server is down.
    2.  **"The Interface"**: Define an `IUserService` that both old and new APIs must satisfy.
    3.  **"The Adapter"**: Wrap the Legacy API in a class that matches the Interface.
    4.  **"The Switch"**: Implement a `HotSwitchState` signal to toggle the provider in real-time.
    5.  **"The Migration"**: Successfully fetch data from the New API while seamlessly falling back if needed.

### 12. ⏳ The Time Dilator (Performance)
**Focus:** Lifecycle Optimization, Lazy Loading, Memoization.
**Status:** 🚧 Coming Soon

*   **Scenario (Flavor):** **The Sludge Pits**. The air is thick; every movement takes seconds (jank). Gravity is 10x stronger.
*   **NPC:** **The Chronomancer**. Moves effortlessly while others struggle. *Dialogue*: "Time is constant. Your perception of it is just inefficient processing."
*   **Legacy Code:**
    ```javascript
    // Expensive Calculation in Render
    render() {
      const pi = calculatePi(10000); // Blocks the main thread
      return html`<div>${pi}</div>`;
    }
    ```
*   **The Refactor:**
    ```javascript
    // Memoized & Lifecycle Aware
    willUpdate(changed) {
      if (changed.has('precision')) {
        this.pi = calculatePi(this.precision); // Only recalculates when needed
      }
    }
    ```
*   **Reward:** **The Tachyon Boots**. Ability: "Instant Step" - UI interactions happen in <16ms.
*   **Chapter Roadmap:**
    1.  **"The Heavy Render"**: Identify a component rerendering 50 times per second due to an unstable object prop.
    2.  **"The Lazy Traveler"**: A massive library is loading on the homepage. **Task**: Use `import()` to lazy load it.
    3.  **"The Memory Leak"**: A timer isn't cleared on `disconnectedCallback`.
    4.  **"The Will To Update"**: Move data sorting logic from `render()` to `willUpdate()`.
    5.  **"The Stabilizer"**: Use `noChange` from Lit directives to prevent unneeded DOM updates.

---

## 🛠️ How to Create a New Chapter

1.  **Define the Learning Objective**: What *single* concept are we teaching?
2.  **Create the "Broken" State**:
    *   Think: How would a junior dev write this incorrectly?
    *   Example: Hardcoding a color instead of using a variable.
3.  **Write the Validation Logic**:
    *   How do we prove the user fixed it?
    *   *Static Analysis*: Regex check code.
    *   *Runtime Check*: Check computed style or DOM structure.
4.  **Write the Narrative**:
    *   Alarion enters a room...
    *   The "Monster" is the bug.
    *   The "Spell" is the code fix.
5.  **Define the Data (`src/content/quests/`)**:
    *   Create a new directory for the quest.
    *   Define `QuestData` (ID, name, difficulty, concepts).
    *   Define levels (Chapters) with:
        *   `problemTitle` / `problemDesc`: The "Broken" state.
        *   `solutionTitle` / `solutionDesc`: The "Fixed" state.
        *   `codeSnippets`: Show the before/after code.
        *   `npc`: The mentor character.
            *   `requirements`: Optional conditions to interact (e.g., `{ hotSwitchState: { value: "new", message: "REQ: NEW API" } }`).
        *   `reward`: The badge earned.
    *   Register it in `quests-data.js`.

6.  **Implement Mechanics (Data-Driven)**:
    *   **Goal**: Better encapsulation. Avoid modifying core Controllers (`GameZoneController`) for specific Quest logic.
    *   **Method**: Define **Generic Zones** in your `LevelConfig`:
        ```javascript
        zones: [
            // Example: trigger a context switch when entering a region
            { x: 0, y: 0, width: 100, height: 50, type: "CONTEXT_CHANGE", payload: "new" }
        ]
        ```
    *   This adheres to the **Open/Closed Principle**: The engine is open for extension (via data) but closed for modification.
