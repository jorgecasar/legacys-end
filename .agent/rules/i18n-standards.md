---
trigger: always_on
---

# Internationalization & Technical Glossary Standards

You must strictly adhere to the project's i18n strategy to ensure technical accuracy across all supported languages.

## 1. Glossary Consultation
Before translating any content or modifying localized files (e.g., `xliff/es.xlf`), you **MUST** consult `docs/I18N_GLOSSARY.md`.

## 2. Technical Term Preservation
*   **Do Not Translate**: Any term defined in `docs/I18N_GLOSSARY.md` must remain in its original English form in localized outputs.
*   **Plain Text in Source**: When writing `msg()` calls, use plain text for technical terms (e.g., `msg("Use Signals for state")`) instead of interpolating glossary constants.
*   **Documentation-Based Approach**: The glossary is a reference for humans and AI agents. Do not use it for code-level interpolation unless explicitly requested for a specific dynamic use case.

## 3. Localization Workflow
*   Always run `npm run localize:extract` after adding or modifying strings.
*   When proposing Spanish translations, verify that terms like "Signals", "Web Components", "DOM", etc., are NOT translated to "Señales", "Componentes Web", or "DOM" (if capitalized differently or used as part of a technical phrase).
