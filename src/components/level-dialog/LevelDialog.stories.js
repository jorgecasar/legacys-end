import { Signal } from "@lit-labs/signals";
import { html } from "lit";
import "./level-dialog.js";
import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "../../pixel.css";

export default {
	title: "Components/Game/LevelDialog",
	component: "level-dialog",
	decorators: [
		/** @param {any} story */
		(story) => html`
      <div class="wa-theme-pixel wa-light sl-theme-light" style="height: 100vh; width: 100vw; position: relative; background: #fff; display: flex; align-items: center; justify-content: center;">
        ${story()}
      </div>
    `,
	],
};

const Template = () => {
	const worldState = {
		currentSlideIndex: new Signal.State(0),
		setShowDialog: () => {},
		nextSlide: () => {},
		prevSlide: () => {},
	};

	const questController = {
		currentChapter: {
			id: "storybook-chapter",
			title: "Storybook Training",
			description:
				"Alarion is learning how to use Storybook to verify his components.",
			problemDesc: "The components are too coupled to the main application!",
			architecturalChanges: [
				"Use Context API",
				"Implement Signals",
				"Decouple Styles",
			],
			reward: { name: "Umbrella", image: "/assets/swamp-of-scope/reward.png" },
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

	const questState = {
		hasCollectedItem: new Signal.State(false),
		isRewardCollected: new Signal.State(false),
	};

	// Manual injection via property assignment
	setTimeout(() => {
		const el = document.querySelector("level-dialog");
		if (el) {
			Object.assign(el, { worldState, questController, questState });
			el.requestUpdate();
		}
	}, 50);

	return html`<level-dialog></level-dialog>`;
};

export const Default = Template.bind({});
