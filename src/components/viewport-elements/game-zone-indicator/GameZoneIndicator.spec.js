import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HotSwitchStates, ThemeModes } from "../../../core/constants.js";
import { GameZoneIndicator } from "./GameZoneIndicator.js";
import "./game-zone-indicator.js";

/** @typedef {import("../../../content/quests/quest-types.js").Zone} Zone */

describe("GameZoneIndicator", () => {
	/** @type {HTMLElement} */
	let container;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.removeChild(container);
	});

	it("should be defined", () => {
		const el = document.createElement("game-zone-indicator");
		expect(el).toBeInstanceOf(GameZoneIndicator);
	});

	it("should render nothing when no zones provided", async () => {
		const el = /** @type {GameZoneIndicator} */ (
			document.createElement("game-zone-indicator")
		);
		container.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot?.querySelectorAll(".zone").length).toBe(0);
	});

	it("should render zones matching the type provided", async () => {
		/** @type {Zone[]} */
		const zones = [
			/** @type {Zone} */ (
				/** @type {unknown} */ ({
					type: "THEME_CHANGE",
					x: 10,
					y: 10,
					width: 50,
					height: 50,
					payload: ThemeModes.DARK,
				})
			),
			/** @type {Zone} */ (
				/** @type {unknown} */ ({
					type: "CONTEXT_CHANGE",
					x: 60,
					y: 10,
					width: 50,
					height: 50,
					payload: HotSwitchStates.LEGACY,
				})
			),
		];

		const el = /** @type {GameZoneIndicator} */ (
			document.createElement("game-zone-indicator")
		);
		el.type = "THEME_CHANGE";
		el.zones = zones;
		container.appendChild(el);
		await el.updateComplete;

		const renderedZones = el.shadowRoot?.querySelectorAll(".zone");
		expect(renderedZones).toBeDefined();
		expect(renderedZones?.length).toBe(1);
		const firstZone = /** @type {HTMLElement} */ (renderedZones?.[0]);
		expect(firstZone.style.left).toContain("10%");
	});

	it("should update rendered zones when zones property changes", async () => {
		const el = /** @type {GameZoneIndicator} */ (
			document.createElement("game-zone-indicator")
		);
		el.type = "THEME_CHANGE";
		container.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot?.querySelectorAll(".zone").length).toBe(0);

		const zones = [
			{
				type: "THEME_CHANGE",
				x: 20,
				y: 20,
				width: 50,
				height: 50,
				payload: ThemeModes.LIGHT,
			},
		];

		el.zones = zones;
		await el.updateComplete;

		const renderedZones = el.shadowRoot?.querySelectorAll(".zone");
		expect(renderedZones).toBeDefined();
		expect(renderedZones?.length).toBe(1);
		const firstUpdatedZone = /** @type {HTMLElement} */ (renderedZones?.[0]);
		expect(firstUpdatedZone.style.top).toContain("20%");
	});
});
