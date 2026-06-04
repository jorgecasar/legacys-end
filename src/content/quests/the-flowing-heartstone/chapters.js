import { msg } from "@lit/localize";
import { TrafficLightStates, ZoneTypes } from "../../../core/constants.js";

/**
 * The Flowing Heartstone Quest - Chapter Data
 *
 * This quest focuses on TC39 Signals and Fine-grained Reactivity:
 * - the-pressure-sensor: Signal.State (Autonomous Data)
 * - the-turn-automator: Signal.Computed (Lazy Logic)
 * - the-fiber-optic-cable: Signal.subtle.Watcher (Direct DOM binding)
 * - the-ambulance-hub: The Logic Graph (Atomic Consistency / Glitch-free)
 * - the-fuse-box: Store Governance (Read-only projections)
 */

/** @typedef {import("../quest-types.js").LevelConfig} LevelConfig */

/** @returns {Record<string, LevelConfig>} */
export const getTheFlowingHeartstoneChapters = () => ({
	"the-pressure-sensor": {
		id: "the-pressure-sensor",
		title: msg("The Pedestrian Crossing"),
		description: msg(
			"I'm isolating this pressure sensor. It was so chained to the core grid that a simple footstep caused the entire intersection to collapse and redraw. Step closer, I'll teach you how to decouple it.",
		),
		zones: [
			{
				x: 0,
				y: 0,
				width: 100,
				height: 100,
				type: ZoneTypes.TRAFFIC_LIGHT_CHANGE,
				payload: TrafficLightStates.GREEN,
			},
			{
				x: 20,
				y: 67.5,
				width: 55,
				height: 16,
				type: ZoneTypes.TRAFFIC_LIGHT_CHANGE,
				payload: TrafficLightStates.RED,
			},
			{
				x: 77,
				y: 32,
				width: 3.2,
				height: 3.2,
				type: ZoneTypes.TRAFFIC_LIGHT_RED,
				payload: null,
			},
			{
				x: 77,
				y: 42,
				width: 3.2,
				height: 3.2,
				type: ZoneTypes.TRAFFIC_LIGHT_GREEN,
				payload: null,
			},
		],
		problemTitle: msg("Before: Massive Re-rendering"),
		problemDesc: msg(
			"The sensor's state was shackled to the root of the UI tree through a massive global context. Consequently, every minor interaction detonated a shockwave that forced the framework to critically and unnecessarily re-render the entire intersection.",
		),
		solutionTitle: msg("After: The Autonomous Data"),
		architecturalChanges: [
			msg(
				"Signal.State: A pure reactive container that mutates in absolute silence.",
			),
			msg(
				"State outside the UI: Data lives in memory independently of the DOM lifecycle.",
			),
		],
		codeSnippets: {
			start: [
				{
					title: msg("Legacy Lit (Events and Props)"),
					interactive: true,
					projectSrc:
						import.meta.env.BASE_URL +
						"quests/the-flowing-heartstone/demos/the-pressure-sensor/legacy/project.json",
				},
			],
			end: [
				{
					title: msg("Modern Lit (TC39 Signals)"),
					interactive: true,
					projectSrc:
						import.meta.env.BASE_URL +
						"quests/the-flowing-heartstone/demos/the-pressure-sensor/modern/project.json",
				},
			],
		},
		scale: 20,
		stats: { maintainability: 10, portability: 10, performance: 30 },
		backgroundStyle: `url('/assets/the-pressure-sensor/background.png')`,
		startPos: { x: 15, y: 100 },
		exitZone: { x: 15, y: 90, width: 10, height: 20, label: msg("Next") },
		npc: {
			name: msg("The Wiretapper"),
			image: "/assets/the-pressure-sensor/npc.png",
			position: { x: 80, y: 70 },
			requirements: {
				trafficLightState: {
					value: TrafficLightStates.GREEN,
					message: msg(
						"I have a detector on the crosswalk, and every footstep forces me to rebuild the entire intersection's matrix. Step out of the crosswalk so the light turns green and we can talk without overloading the system!",
					),
				},
			},
		},
		reward: {
			scale: 10,
			name: msg("Isolated Sensor"),
			image: "/assets/the-pressure-sensor/reward.png",
			position: { x: 95, y: 75 },
		},
		hero: { image: "/assets/the-pressure-sensor/hero.png" },
	},
	"the-turn-automator": {
		id: "the-turn-automator",
		title: msg("The Turn Automator"),
		description: msg(
			"What a disaster of efficiency! The core wastes energy calculating traffic density incessantly, even when the streets are empty. I'll show you how to forge a reactive intermediate node that remains dormant until its data is explicitly demanded.",
		),
		problemTitle: msg("Before: Eager Computation"),
		problemDesc: msg(
			"The legacy system suffered from eager evaluation, aggressively recalculating heavy derived state on every lifecycle heartbeat, draining precious CPU cycles even when all monitors were offline.",
		),
		solutionTitle: msg("After: Lazy Mirrors"),
		architecturalChanges: [
			msg("Signal.Computed: Derived data with native memoization."),
			msg(
				"Lazy Evaluation: The computational cost is ZERO if nobody extracts the computed value.",
			),
		],
		codeSnippets: {
			start: [
				{
					title: msg("Legacy Lit (Eager)"),
					interactive: true,
					projectSrc:
						import.meta.env.BASE_URL +
						"quests/the-flowing-heartstone/demos/the-turn-automator/legacy/project.json",
				},
			],
			end: [
				{
					title: msg("Modern Lit (Lazy Computed)"),
					interactive: true,
					projectSrc:
						import.meta.env.BASE_URL +
						"quests/the-flowing-heartstone/demos/the-turn-automator/modern/project.json",
				},
			],
		},
		scale: 40,
		stats: { maintainability: 10, portability: 10, performance: 40 },
		backgroundStyle: `url('/assets/the-turn-automator/background.png')`,
		startPos: { x: 80, y: 20 },
		exitZone: { x: 90, y: 5, width: 10, height: 20, label: msg("Next") },
		npc: {
			name: msg("The Idle Engineer"),
			image: "/assets/the-turn-automator/npc.png",
			position: { x: 50, y: 70 },
		},
		reward: {
			scale: 15,
			name: msg("The Lazy Smart Chip"),
			image: "/assets/the-turn-automator/reward.png",
			position: { x: 38, y: 45 },
		},
		hero: { image: "/assets/the-turn-automator/hero.png" },
	},
	"the-fiber-optic-cable": {
		id: "the-fiber-optic-cable",
		title: msg("The Fiber Optic Cable"),
		description: msg(
			"Why yell to the whole city just to turn on a single traffic light? I'm threading a direct fiber optic filament right into its lens. Let me teach you how to bypass the framework's chaotic massive diffing.",
		),
		problemTitle: msg("Before: VDOM Diffing"),
		problemDesc: msg(
			"The legacy framework unleashed destructive 'diffing', blindly comparing hundreds of virtual nodes only to discover the sole required mutation was altering the text of a tiny <span> on the periphery.",
		),
		solutionTitle: msg("After: Surgical Notification"),
		architecturalChanges: [
			msg(
				"Signal.subtle.Watcher: Tracks dependencies to trigger targeted effects.",
			),
			msg(
				"Direct DOM Mutation: We bypass framework re-renders, updating the element with O(1) cost.",
			),
		],
		codeSnippets: {
			start: [
				{
					title: msg("Legacy Lit (Template Diffing)"),
					interactive: true,
					projectSrc:
						import.meta.env.BASE_URL +
						"quests/the-flowing-heartstone/demos/the-fiber-optic-cable/legacy/project.json",
				},
			],
			end: [
				{
					title: msg("Modern Lit (Watch Directive)"),
					interactive: true,
					projectSrc:
						import.meta.env.BASE_URL +
						"quests/the-flowing-heartstone/demos/the-fiber-optic-cable/modern/project.json",
				},
			],
		},
		scale: 30,
		stats: { maintainability: 20, portability: 10, performance: 50 },
		backgroundStyle: `url('/assets/the-fiber-optic-cable/background.png')`,
		startPos: { x: 30, y: 80 },
		exitZone: { x: 40, y: 10, width: 10, height: 20, label: msg("Next") },
		npc: {
			name: msg("The Fiber Weaver"),
			image: "/assets/the-fiber-optic-cable/npc.png",
			position: { x: 70, y: 60 },
		},
		reward: {
			scale: 12,
			name: msg("The Surgical Laser Splicer"),
			image: "/assets/the-fiber-optic-cable/reward.png",
			position: { x: 85, y: 65 },
		},
		hero: { image: "/assets/the-fiber-optic-cable/hero.png" },
	},
	"the-ambulance-hub": {
		id: "the-ambulance-hub",
		title: msg("The Ambulance Hub"),
		description: msg(
			"Event concurrency is fracturing our interface! An ambulance and a traffic spike have collided in memory. I'm stabilizing the main node to guarantee tear-free atomic updates. Watch closely!",
		),
		problemTitle: msg("Before: Glitchy Renders (Tearing)"),
		problemDesc: msg(
			"Isolated state mutations triggered the framework in multiple chaotic passes, causing dangerous visual 'tearing' where the screen displayed invalid and corrupted state frames.",
		),
		solutionTitle: msg("After: Atomic Consistency"),
		architecturalChanges: [
			msg(
				"DAG (Directed Acyclic Graph): Perfectly structures dependencies without cycles.",
			),
			msg(
				"Push/Pull Algorithm: Stabilizes the graph in blocks, guaranteeing the DOM updates only once atomically.",
			),
		],
		codeSnippets: {
			start: [
				{
					title: msg("Legacy Lit (Tearing)"),
					interactive: true,
					projectSrc:
						import.meta.env.BASE_URL +
						"quests/the-flowing-heartstone/demos/the-ambulance-hub/legacy/project.json",
				},
			],
			end: [
				{
					title: msg("Modern Lit (Atomic Graph)"),
					interactive: true,
					projectSrc:
						import.meta.env.BASE_URL +
						"quests/the-flowing-heartstone/demos/the-ambulance-hub/modern/project.json",
				},
			],
		},
		stats: { maintainability: 30, portability: 10, performance: 20 },
		backgroundStyle: `url('/assets/the-ambulance-hub/background.png')`,
		startPos: { x: 10, y: 50 },
		exitZone: { x: 100, y: 50, width: 10, height: 20, label: msg("Next") },
		npc: {
			name: msg("The Chrono-Dispatcher"),
			image: "/assets/the-ambulance-hub/npc.png",
			position: { x: 85, y: 15 },
		},
		reward: {
			name: msg("The Atomic Chronometer"),
			image: "/assets/the-ambulance-hub/reward.png",
			position: { x: 50, y: 10 },
		},
		hero: { image: "/assets/the-ambulance-hub/hero.png" },
	},
	"the-fuse-box": {
		id: "the-fuse-box",
		title: msg("The Locked Fuse Box"),
		description: msg(
			"Integrity breach detected! The main network is fully exposed; any rookie module could overwrite raw traffic data. Help me lock this fuse box, and we'll expose only safe, read-only reactive mirrors.",
		),
		problemTitle: msg("Before: Unprotected Signals"),
		problemDesc: msg(
			"A dangerously exposed global signal state. Migrating to signals doesn't automatically protect your state; any peripheral node could still overwrite the source of truth by calling .set() on an exposed Signal.",
		),
		solutionTitle: msg("After: Store Governance"),
		architecturalChanges: [
			msg(
				"Private State: The real state is shielded in JS (#cars) so it cannot be mutated from the outside.",
			),
			msg(
				"Read-only Projections: Computed signals are exposed as safe, immutable mirrors for the UI.",
			),
		],
		codeSnippets: {
			start: [
				{
					title: msg("Unprotected Signals"),
					interactive: true,
					projectSrc:
						import.meta.env.BASE_URL +
						"quests/the-flowing-heartstone/demos/the-fuse-box/legacy/project.json",
				},
			],
			end: [
				{
					title: msg("Protected Signals (Store Governance)"),
					interactive: true,
					projectSrc:
						import.meta.env.BASE_URL +
						"quests/the-flowing-heartstone/demos/the-fuse-box/modern/project.json",
				},
			],
		},
		scale: 30,
		stats: { maintainability: 50, portability: 10, performance: 10 },
		backgroundStyle: `url('/assets/the-fuse-box/background.png')`,
		startPos: { x: 50, y: 100 },
		exitZone: { x: 95, y: 70, width: 40, height: 30, label: msg("Next") },
		npc: {
			name: msg("The Cyber Guardian"),
			image: "/assets/the-fuse-box/npc.png",
			position: { x: 70, y: 65 },
		},
		reward: {
			scale: 12,
			name: msg("The Encrypted Master Key"),
			image: "/assets/the-fuse-box/reward.png",
			position: { x: 50, y: 50 },
		},
		hero: {
			image: "/assets/the-fuse-box/hero.png",
		},
	},
});
