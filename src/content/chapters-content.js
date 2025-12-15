export const FORTRESS_OF_DESIGN_CONTENT = {
	codeSnippetStart: `/* ❌ Hardcoded Colors */
.tunic {
    background-color: #1e3a8a; /* Blue */
}

/* No easy way to change theme without overriding styles */`,
	codeSnippetEnd: `/* ✅ Design Tokens (CSS Vars) */
:host {
    --tunic-color: #1e3a8a;
}

:host(.dark-theme) {
    --tunic-color: #818cf8; /* Neon */
}

.tunic {
    background: var(--tunic-color);
}`,
};
