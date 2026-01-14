# i18n Technical Glossary

This document contains technical terms that **must NOT be translated** in any localized version of the application.

## Purpose

When translating content to other languages (e.g., Spanish in `xliff/es.xlf`), these terms must remain in their original English form to maintain technical accuracy and consistency.

## Usage

- **For Human Translators**: Consult this list before translating XLIFF files
- **For AI Agents**: This is a mandatory reference when proposing translations
- **For Developers**: Keep technical terms as plain text in `msg()` calls

---

## Core Frameworks & Tools

- **LEGACY'S END** - The game title
- **Lit** - The web component framework
- **Vite** - The build tool
- **Playwright** - The testing framework
- **TypeScript** - The type system
- **JavaScript** - The programming language
- **Vitest** - The unit testing framework
- **Storybook** - The component documentation tool
- **Git** - The version control system
- **Model Context Protocol (MCP)** - The AI integration protocol
- **Web Components** - The web standard

## Architectural Patterns & Concepts

- **Dependency Injection (DI)**
- **Inversion of Control (IoC)**
- **Separation of Concerns (SoC)**
- **Shadow DOM** - The encapsulation mechanism
- **DOM** - Document Object Model
- **Context** - The data sharing pattern
- **Context Provision** / **Context Consumption**
- **Context Provider** / **Context Consumer**
- **Provider** / **Consumer**
- **State** - Application state
- **Reactive State** - Reactive data patterns
- **Signals** / **Signal** - Reactive primitives
- **Observers** - Reactive observers
- **Design Systems** - UI design frameworks
- **Design Tokens** - Design variables
- **CSS Tokens** / **CSS Variables** - Styling variables
- **Dynamic Injection** - Runtime dependency injection
- **Hot Switch** - Runtime service swapping
- **A/B test** - Experimentation pattern
- **Global Scope** - JavaScript scope
- **Fire and Forget** - Event dispatch pattern

## Standards & Protocols

- **API** - Application Programming Interface
- **REST API** - RESTful web services
- **HTML** - HyperText Markup Language
- **CSS** - Cascading Style Sheets
- **i18n** - Internationalization
- **a11y** - Accessibility
- **Accessibility** - Web accessibility
- **ARIA** - Accessible Rich Internet Applications
- **ESNext** - Modern JavaScript features
- **Baseline** - Web platform baseline
- **JSDoc** - JavaScript documentation

## General Technical Terms

- **UI** - User Interface
- **Frontend** - Client-side code
- **Backend** - Server-side code
- **Legacy** - Old/outdated code
- **bundle** - Compiled application package
- **Unit Tests** / **Unit Testing** - Automated testing
- **Mock** / **Mocking** / **Mock Provider** - Test doubles
- **Attributes** / **Properties** - Component API
- **Custom Events** - DOM events
- **Interface** / **Interfaces** / **Contracts** - Type contracts
- **YAML** - Data serialization format
- **JSON** - JavaScript Object Notation

---

## Translation Examples

### ✅ Correct (English preserved)

```xml
<source>Use Signals for reactive state</source>
<target>Usa Signals para estado reactivo</target>
```

### ❌ Incorrect (Technical term translated)

```xml
<source>Use Signals for reactive state</source>
<target>Usa Señales para estado reactivo</target>
```
