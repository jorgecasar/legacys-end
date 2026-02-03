const config = {
	stories: ["../src/**/*.stories.js", "../src/**/*.mdx"],
	addons: [
		"@chromatic-com/storybook",
		"@storybook/addon-a11y",
		"@storybook/addon-docs",
		"@storybook/addon-actions",
	],
	framework: "@storybook/web-components-vite",
};
export default config;
