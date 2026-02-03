import { html } from "lit";
import {
	HotSwitchStates,
	ThemeModes,
	ZoneTypes,
} from "../../../core/constants.js";
import "./game-zone-indicator.js";

export default {
	title: "Components/Game/GameZoneIndicator",
	component: "game-zone-indicator",
	argTypes: {
		type: {
			control: { type: "select" },
			options: [ZoneTypes.THEME_CHANGE, ZoneTypes.CONTEXT_CHANGE],
		},
	},
};

/** @param {any} args */
const Template = (args) => {
	return html`
    <div style="width: 100%; height: 300px; position: relative; background: #eee; border: 1px dashed #ccc;">
      <game-zone-indicator .type="${args.type}" .zones="${args.zones}"></game-zone-indicator>
    </div>
  `;
};

/** @type {{args: any, render: any}} */
export const ThemeZones = {
	render: Template,
	args: {
		type: ZoneTypes.THEME_CHANGE,
		zones: [
			{
				type: ZoneTypes.THEME_CHANGE,
				x: 10,
				y: 10,
				width: 30,
				height: 80,
				payload: ThemeModes.DARK,
			},
			{
				type: ZoneTypes.THEME_CHANGE,
				x: 60,
				y: 10,
				width: 30,
				height: 80,
				payload: ThemeModes.LIGHT,
			},
		],
	},
};

/** @type {{args: any, render: any}} */
export const ContextZones = {
	render: Template,
	args: {
		type: ZoneTypes.CONTEXT_CHANGE,
		zones: [
			{
				type: ZoneTypes.CONTEXT_CHANGE,
				x: 10,
				y: 10,
				width: 30,
				height: 80,
				payload: HotSwitchStates.LEGACY,
			},
			{
				type: ZoneTypes.CONTEXT_CHANGE,
				x: 60,
				y: 10,
				width: 30,
				height: 80,
				payload: HotSwitchStates.NEW,
			},
		],
	},
};
