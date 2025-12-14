/**
 * DebugController - Lit Reactive Controller for debug mode
 * 
 * Enables debug mode when ?debug is present in URL
 * Exposes window.game API with commands:
 * - setLevel(1-6)
 * - giveItem()
 * - teleport(x, y)
 * - getState()
 * - setTheme('light'|'dark')
 * - help()
 * 
 * Usage:
 * ```js
 * this.debug = new DebugController(this, {
 *   getState: () => ({ level: this.level, ... }),
 *   setLevel: (level) => { this.level = level; },
 *   ...
 * });
 * ```
 */
export class DebugController {
	constructor(host, options = {}) {
		this.host = host;
		this.options = options;
		this.isEnabled = new URLSearchParams(window.location.search).has('debug');

		host.addController(this);
	}

	hostConnected() {
		if (this.isEnabled) {
			this.enableDebugMode();
		}
	}

	hostDisconnected() {
		if (this.isEnabled && window.game) {
			delete window.game;
		}
	}

	enableDebugMode() {
		window.game = {
			// Jump to any chapter
			setChapter: (chapterId) => {
				if (this.options.setLevel) {
					this.options.setLevel(chapterId);
				}
			},

			// Give current level's item
			giveItem: () => {
				if (this.options.giveItem) {
					this.options.giveItem();
				}
			},

			// Teleport character
			teleport: (x, y) => {
				if (this.options.teleport) {
					this.options.teleport(x, y);
				}
			},

			// Get current game state
			getState: () => {
				if (this.options.getState) {
					const state = this.options.getState();
					console.table(state);
					return state;
				}
				return {};
			},

			// Switch theme
			setTheme: (mode) => {
				if (this.options.setTheme) {
					this.options.setTheme(mode);
				}
			},

			// Quest Commands
			startQuest: (questId) => {
				if (this.options.startQuest) {
					this.options.startQuest(questId);
				}
			},

			completeQuest: () => {
				if (this.options.completeQuest) {
					this.options.completeQuest();
				}
			},

			completeChapter: () => {
				if (this.options.completeChapter) {
					this.options.completeChapter();
				}
			},

			returnToHub: () => {
				if (this.options.returnToHub) {
					this.options.returnToHub();
				}
			},

			listQuests: () => {
				if (this.options.listQuests) {
					return this.options.listQuests();
				}
			},

			getProgress: () => {
				if (this.options.getProgress) {
					const progress = this.options.getProgress();
					console.log('📊 Quest Progress:');
					console.table(progress);
					return progress;
				}
			},

			resetProgress: () => {
				if (this.options.resetProgress) {
					if (confirm('⚠️ Reset all quest progress? This cannot be undone!')) {
						this.options.resetProgress();
						console.log('🔄 Progress reset!');
					}
				}
			},

			// Show help
			help: () => {
				console.log(`
🎮 Debug Mode Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEVEL COMMANDS:
  game.setChapter('id')       - Jump to any chapter
  game.giveItem()             - Collect current level's item
  game.teleport(x, y)         - Move character to position
  game.setTheme('light'|'dark') - Switch theme

QUEST COMMANDS:
  game.startQuest(id)         - Start a specific quest
  game.completeQuest()        - Complete current quest
  game.completeChapter()      - Complete current chapter
  game.returnToHub()          - Return to quest hub
  game.listQuests()           - List all available quests
  game.getProgress()          - View quest progress
  game.resetProgress()        - Reset all quest progress

GENERAL:
  game.getState()             - View current game state
  game.help()                 - Show this help
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
				`);
			}
		};

		console.log(`
🎮 DEBUG MODE ENABLED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type 'game.help()' for available commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
		`);

		// Show initial state
		window.game.getState();
	}
}
