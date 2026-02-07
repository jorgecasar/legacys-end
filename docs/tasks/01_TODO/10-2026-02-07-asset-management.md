# Centralized Asset Management System <!-- id: 2026-02-07-asset-management -->

> **Status**: Todo
> **Created**: 2026-02-07
> **Last Updated**: 2026-02-07

## Context & Goal
Assets (images, future audio) are preloaded and managed manually across services. This doesn't scale well and can lead to memory leaks or broken paths.

## Plan
- [ ] Create an `AssetRegistryService`.
- [ ] Implement a centralized manifest for all static assets.
- [ ] Add support for "Asset Groups" (e.g., load all assets for Chapter 1).
- [ ] Decouple `PreloaderService` from specific chapter logic, making it a consumer of the `AssetRegistry`.

## Artifacts
- `src/services/asset-registry-service.js` (new)
- `src/services/preloader-service.js`

## Memory / Current State
- `PreloaderService` is currently tightly coupled.
- Next step: Design the asset manifest structure.
