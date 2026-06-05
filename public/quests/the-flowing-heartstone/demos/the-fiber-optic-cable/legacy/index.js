import { html, LitElement } from "lit";

class CityIntersection extends LitElement {
	static properties = {
		isJam: { type: Boolean },
	};

	constructor() {
		super();
		this.isJam = false;
		this.renderCount = 0;
	}

	connectedCallback() {
		super.connectedCallback();
		this.interval = setInterval(() => {
			this.isJam = !this.isJam;
		}, 1500);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		clearInterval(this.interval);
	}

	render() {
		this.renderCount++;

		return html`
			<div class="intersection">
				<h3>Central Intersection</h3>
				<!-- Traditional Prop: Re-renders the entire template to update this single node -->
				<span class="light">${this.isJam ? "🔴" : "🟢"}</span>
			</div>
			<div class="logs">
				Render count: ${this.renderCount}<br>
				With classic properties, Lit executes render() on every change. Even if the rest of the template is cached, it still has to run the function and diff the tree.
			</div>
		`;
	}
}
customElements.define("city-intersection", CityIntersection);
