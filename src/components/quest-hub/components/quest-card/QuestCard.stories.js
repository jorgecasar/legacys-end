import { html } from "lit";
import "./quest-card.js";

export default {
	title: "Components/QuestHub/QuestCard",
	component: "quest-card",
};

/** @param {any} args */
const Template = (args) => html`
  <quest-card
    .quest="${args.quest}"
    .isComingSoon="${args.isComingSoon}"
  ></quest-card>
`;

/** @type {{args: any, render: any}} */
export const Default = {
	render: Template,
	args: {
		quest: {
			id: "the-aura-of-sovereignty",
			name: "The Aura of Sovereignty",
			subtitle: "Forging the Immutable Shield",
			description:
				"Gain Encapsulation and Isolation from the global environment.",
			difficulty: "beginner",
			estimatedTime: "10 min",
			icon: "shield",
			progress: 0,
			isCompleted: false,
			isLocked: false,
		},
		isComingSoon: false,
	},
};

/** @type {{args: any, render: any}} */
export const Completed = {
	render: Template,
	args: {
		...Default.args,
		quest: {
			...Default.args.quest,
			progress: 100,
			isCompleted: true,
		},
	},
};

/** @type {{args: any, render: any}} */
export const Locked = {
	render: Template,
	args: {
		...Default.args,
		quest: {
			...Default.args.quest,
			isLocked: true,
		},
	},
};
