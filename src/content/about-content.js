import { msg } from "@lit/localize";

export const getAboutSlidesContent = () => [
	{
		title: msg("Legacy's End"),
		lines: [
			msg("A game built with Lit and Web Awesome."),
			msg("Demonstrating the power of modern web standards."),
		],
	},
	{
		title: msg("Jorge del Casar"),
		lines: [
			msg("Head of Tech at ActioGlobal"),
			msg("Google Developer Expert"),
			msg("+20 years working on web"),
		],
	},
	{
		title: msg("Web Components Expert"),
		lines: [
			msg("Creating reusable, encapsulated, and standard-based UI components."),
		],
	},
];
