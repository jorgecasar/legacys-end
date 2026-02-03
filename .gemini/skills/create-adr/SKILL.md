---
name: create-adr
description: Creates a new Architecture Decision Record (ADR) file.
---

# Create ADR Skill

This skill automates the creation of numbered ADR files in `docs/adr/`.

## Inputs

- `title` (required): The title of the architectural decision.

## Instructions

1.  **Determine the Next Number**:
    - List files in `docs/adr/`.
    - Look for files matching the pattern `XXXX-*.md` (where XXXX is a number).
    - Find the highest number.
    - If no files exist, start at `0001`.
    - Otherwise, increment the highest number by 1 (pad with leading zeros to 4 digits).

2.  **Format the Filename**:
    - Convert `title` to kebab-case.
    - Filename format: `[XXXX]-[kebab-title].md`.

3.  **Read the Template**:
    - Read `docs/adr/TEMPLATE.md`.

4.  **Create the File**:
    - Replace `[Number]` with the calculated number (e.g., 0001).
    - Replace `[Title]` with the provided title.
    - Replace `[YYYY-MM-DD]` with the current date.
    - Replace `[Status]` with "Proposed".
    - Write the content to `docs/adr/[filename]`.

5.  **Output**:
    - Print the path of the created ADR.

## Example Usage

User: "Create an ADR for using Lit Signals"
Agent:
1. Scans `docs/adr/`. Finds `0002-use-context.md` (max 2).
2. Calculates next number: `0003`.
3. Creates `docs/adr/0003-use-lit-signals.md`.
