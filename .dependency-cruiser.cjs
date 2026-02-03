/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
	forbidden: [
		/* RULES:
       1. No Circular Dependencies
       2. Layered Architecture:
          - components -> services (OK)
          - services -> components (FORBIDDEN)
          - services -> controllers (FORBIDDEN)
       3. Decoupled Features:
          - Feature A cannot import Feature B source files directly
    */
		{
			name: "no-circular",
			severity: "error",
			comment: "This module is part of a circular dependency",
			from: {},
			to: { circular: true },
		},
		{
			name: "no-services-to-ui",
			severity: "error",
			comment: "Services MUST NOT depend on UI (components/controllers)",
			from: { path: "^src/services" },
			to: { path: "^src/(components|controllers)" },
		},
		{
			name: "no-cross-feature-imports",
			severity: "error",
			comment:
				"Features should not import other features directly. Use shared services.",
			from: { path: "^src/features/([^/]+)" },
			to: {
				path: "^src/features/([^/]+)",
				pathNot: "^src/features/$1", // Allow internal imports
			},
		},
	],
	options: {
		doNotFollow: {
			path: "node_modules",
		},
		tsPreCompilationDeps: true, // Handle TypeScript/imports correctly
		tsConfig: {
			fileName: "tsconfig.json",
		},
	},
};
