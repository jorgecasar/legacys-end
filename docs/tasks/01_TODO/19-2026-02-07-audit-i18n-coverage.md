# Audit i18n Coverage <!-- id: 2026-02-07-audit-i18n-coverage -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
The project uses `@lit/localize`. We need to ensure that *all* user-facing strings are correctly localized and that the extraction process is working as expected.

## Plan
- [ ] Scan the codebase for hardcoded strings in `html` literals and classes.
- [ ] Ensure all strings are wrapped in `msg()`.
- [ ] Verify that `npm run localize:extract` captures all strings.
- [ ] Check if `src/content/quests` (quest data) is properly localized or if it needs a different strategy.
- [ ] Add a test that verifies the current locale is correctly applied to the UI.

## Artifacts
- `lit-localize.json`
- `xliff/`
- `src/generated/locales/`

## Memory / Current State
- Localization system is in place.
- Next step: Run `localize:extract` and check the generated XLIFF.
