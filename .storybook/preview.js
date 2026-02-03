import { ContextProvider } from "@lit/context";

import { characterContext } from "../src/contexts/character-context.js";
import { localizationContext } from "../src/contexts/localization-context.js";
import { loggerContext } from "../src/contexts/logger-context.js";
import { profileContext } from "../src/contexts/profile-context.js";
import { progressContext } from "../src/contexts/progress-context.js";
import { questControllerContext } from "../src/contexts/quest-controller-context.js";
import { questRegistryContext } from "../src/contexts/quest-registry-context.js";
import { sessionContext } from "../src/contexts/session-context.js";
import { themeContext } from "../src/contexts/theme-context.js";
import { heroStateContext } from "../src/game/contexts/hero-context.js";
import { questStateContext } from "../src/game/contexts/quest-context.js";
import { worldStateContext } from "../src/game/contexts/world-context.js";
import { HeroStateService } from "../src/game/services/hero-state-service.js";
import { QuestStateService } from "../src/game/services/quest-state-service.js";
import { WorldStateService } from "../src/game/services/world-state-service.js";
import { LocalizationService } from "../src/services/localization-service.js";
import { LoggerService } from "../src/services/logger-service.js";
import { ProgressService } from "../src/services/progress-service.js";
import { QuestRegistryService } from "../src/services/quest-registry-service.js";
import { SessionService } from "../src/services/session-service.js";
import { LocalStorageAdapter } from "../src/services/storage-service.js";
import { ThemeService } from "../src/services/theme-service.js";

// Global styles
import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "../src/pixel.css";

// Initialize services once
const logger = new LoggerService();
const storage = new LocalStorageAdapter();
const registry = new QuestRegistryService();
const worldState = new WorldStateService();
const questState = new QuestStateService();
const heroState = new HeroStateService();

// Mock Quest Controller
const questController = {
	currentChapter: {
		id: "storybook-chapter",
		title: "Storybook Training",
		description: "Testing the LevelDialog in isolation.",
		problemDesc: "The components are too coupled!",
		architecturalChanges: ["Use Context API", "Implement Signals"],
		reward: { name: "Knowledge", image: "/assets/swamp-of-scope/reward.png" },
		codeSnippets: {
			start: [
				{
					title: "Legacy Code",
					code: 'const a = document.getElementById("old");',
				},
			],
			end: [
				{
					title: "Clean Code",
					code: "export class NewComponent extends LitElement {}",
				},
			],
		},
	},
	advanceChapter: () => Promise.resolve(),
	completeChapter: () => {},
};

const preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		a11y: {
			test: "todo",
		},
	},
	decorators: [
		(story) => {
			const root = document.body;
			const doc = document.documentElement;

			// Clean up and force light theme
			doc.className = "wa-theme-pixel wa-light sl-theme-light";

			// Hard override for Storybook consistency
			doc.style.colorScheme = "light";

			if (!root.dataset.providersSet) {
				new ContextProvider(root, { context: loggerContext, value: logger });
				new ContextProvider(root, {
					context: localizationContext,
					value: new LocalizationService(logger, storage),
				});
				new ContextProvider(root, {
					context: themeContext,
					value: new ThemeService(logger, storage),
				});
				new ContextProvider(root, {
					context: sessionContext,
					value: new SessionService(),
				});
				new ContextProvider(root, {
					context: questRegistryContext,
					value: registry,
				});
				new ContextProvider(root, {
					context: progressContext,
					value: new ProgressService(storage, registry, logger),
				});
				new ContextProvider(root, {
					context: heroStateContext,
					value: heroState,
				});
				new ContextProvider(root, {
					context: profileContext,
					value: { name: "Alarion", loading: false, error: null },
				});
				new ContextProvider(root, {
					context: characterContext,
					value: { suit: { image: "" } },
				});
				new ContextProvider(root, {
					context: worldStateContext,
					value: worldState,
				});
				new ContextProvider(root, {
					context: questStateContext,
					value: questState,
				});
				new ContextProvider(root, {
					context: questControllerContext,
					value: questController,
				});
				root.dataset.providersSet = "true";
			}
			return story();
		},
	],
};

export default preview;
