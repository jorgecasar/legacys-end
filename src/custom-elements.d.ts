import type { AboutSlides } from "./components/about-slides/AboutSlides.js";
import type { GameHud } from "./components/game-hud/GameHud.js";
import type { GameViewport } from "./components/game-viewport/GameViewport.js";
import type { HeroProfile } from "./components/hero-profile/HeroProfile.js";
import type { LanguageSelector } from "./components/language-selector/LanguageSelector.js";
import type { LegacysEndApp } from "./components/legacys-end-app/LegacysEndApp.js";
import type { LevelDialog } from "./components/level-dialog/LevelDialog.js";
import type { NpcElement } from "./components/npc-element/NpcElement.js";
import type { PauseMenu } from "./components/pause-menu/PauseMenu.js";
import type { QuestCard } from "./components/quest-hub/components/quest-card/QuestCard.js";
import type { QuestHub } from "./components/quest-hub/QuestHub.js";
import type { QuestView } from "./components/quest-view/QuestView.js";
import type { RewardElement } from "./components/reward-element/RewardElement.js";
import type { VictoryScreen } from "./components/victory-screen/VictoryScreen.js";
import type { GameControls } from "./components/viewport-elements/game-controls/GameControls.js";
import type { GameExitZone } from "./components/viewport-elements/game-exit-zone/GameExitZone.js";
import type { GameZoneIndicator } from "./components/viewport-elements/game-zone-indicator/GameZoneIndicator.js";

declare global {
	interface HTMLElementTagNameMap {
		"legacys-end-app": LegacysEndApp;
		"reward-element": RewardElement;
		"pause-menu": PauseMenu;
		"game-controls": GameControls;
		"level-dialog": LevelDialog;
		"game-zone-indicator": GameZoneIndicator;
		"game-exit-zone": GameExitZone;
		"about-slides": AboutSlides;
		"quest-card": QuestCard;
		"quest-hub": QuestHub;
		"victory-screen": VictoryScreen;
		"game-hud": GameHud;
		"npc-element": NpcElement;
		"quest-view": QuestView;
		"game-viewport": GameViewport;
		"language-selector": LanguageSelector;
		"hero-profile": HeroProfile;
	}
}
