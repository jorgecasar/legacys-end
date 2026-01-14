import { msg } from "@lit/localize";
import { ServiceType } from "../../../services/user-services.js";

/**
 * The Orb of Inquiry Quest - Chapter Data
 *
 * This quest focuses on Context Provision and Consumption:
 * - hall-of-definition: Interfaces (Contracts, SoC)
 * - temple-of-inversion: Context Provision (Provider)
 * - the-jewelers-workshop: Context Consumption (Consumer) - The Jeweler's Workshop
 * - assay-chamber: Mocking & Testing (Isolation)
 * - liberated-battlefield: Hot Switch (Dynamic injection, portability)
 */

/** @typedef {import("../quest-types.js").LevelConfig} LevelConfig */

/** @returns {Record<string, LevelConfig>} */
export const getOrbOfInquiryChapters = () => ({
	"hall-of-definition": {
		id: "hall-of-definition",
		title: msg("Hall of Definition"),
		description: msg(
			"Alarion enters the Hall of Definition to learn how to forge abstract service contracts. Before injecting, we must define 'what' a service does, not 'how'. This creates a clear blueprint for any backend interaction.",
		),
		problemTitle: msg("Before: The Concrete Dependency"),
		problemDesc: msg(
			"Component logic assumes direct interaction with fetch or a specific global object. No clear public interface for backend services. Lack of predictability and direct coupling to implementation details, not abstract needs.",
		),
		solutionTitle: msg("After: The Interface Contract"),
		architecturalChanges: [
			msg(
				"Contract First: We define an abstract interface (what the service does).",
			),
			msg(
				"Clarity Gained: The component now expects a service that adheres to this clear contract.",
			),
			msg(
				"Preparation for IoC: This blueprint is the foundation for injecting any compliant service.",
			),
			msg(
				"Future-Proof: Any future backend service must implement this contract, ensuring compatibility.",
			),
		],
		codeSnippets: {
			end: [
				{
					title: msg("Interface Abstraction"),
					code: `export class IProductService {
    // The Contract
    fetchProductData(id) {
        throw new Error("Method 'fetchProductData' must be implemented.");
    }
}

// Component depends on Interface, not Concrete Class`,
				},
			],
		},
		stats: { maintainability: 45, portability: 50 },
		serviceType: /** @type {any} */ (null),
		startPos: { x: 5, y: 50 },
		exitZone: {
			x: 95,
			y: 50,
			width: 10,
			height: 20,
			label: msg("Temple of Inversion"),
		},
		backgroundStyle: `url('/assets/hall-of-definition/background.png')`,
		npc: {
			name: msg("Architect"),
			icon: "pen-tool",
			image: "/assets/hall-of-definition/npc.png",
			position: { x: 70, y: 20 },
		},
		reward: {
			name: msg("Codex"),
			image: "/assets/hall-of-definition/reward.png",
			position: { x: 50, y: 20 },
		},
		hero: {
			image: "/assets/hall-of-definition/hero.png",
			reward: "/assets/hall-of-definition/hero-reward.png",
		},
	},

	"temple-of-inversion": {
		id: "temple-of-inversion",
		title: msg("Temple of Inversion"),
		description: msg(
			"The Purveyor installs the Red Focus Crystal (Legacy Service) into the Altar. This demonstrates Context Provision: establishing a data source that flows downwards, available to any component that requests it.",
		),
		problemTitle: msg("Before: Component Coupling"),
		problemDesc: msg(
			"The service is tightly coupled to the component, making it impossible to share the instance or swap the implementation.",
		),
		solutionTitle: msg("Context Provider"),
		architecturalChanges: [
			msg(
				"Inversion of Control: The parent provides the dependency, the child consumes it.",
			),
			msg(
				"Decoupling: Intermediate components don't need to know about the service.",
			),
			msg(
				"Flexibility: We can provide different implementations at different levels.",
			),
		],
		codeSnippets: {
			start: [
				{
					title: msg("Tightly coupled"),
					code: `export class ProductItem extends LitElement {
    /* ... */
    #service = {
        fetchProductData: (id) => { /* ... */ }
    };
    /* ... */
}`,
				},
			],
			end: [
				{
					title: msg("Create the Context"),
					code: `import { createContext } from '@lit/context';
export const productContext = createContext('product');`,
				},
				{
					title: msg("Create the Provider"),
					code: `import { ContextProvider } from '@lit/context';
import { productContext } from './contexts/product-context.js';

export class ProductProviderLegacy extends LitElement {

    #productContext = new ContextProvider(this, { context: productContext });

    #service = {
        fetchProductData: (id) => {
            return fetch(\`https://legacycorp.com/product-data/\${id}\`)
                .then(res => res.json())
                .catch(err => this.product = {
                    name: 'Error',
                    description: 'Failed to load data'
                })
                .then(data => this.product = data);
        }
    };

    constructor() {
        super();
        this.#productContext.setValue(this.#service);
    }
}
`,
				},
			],
		},
		stats: { maintainability: 80, portability: 80 },
		serviceType: /** @type {any} */ (null),
		startPos: { x: 50, y: 10 },
		exitZone: {
			x: 50,
			y: 90,
			width: 20,
			height: 10,
			label: msg("The Jeweler's Workshop"),
		},
		backgroundStyle: `url('/assets/temple-of-inversion/background.png')`,
		npc: {
			name: msg("Purveyor"),
			icon: "shopping-bag",
			image: "/assets/temple-of-inversion/npc.png",
			position: { x: 30, y: 50 },
		},
		reward: {
			name: msg("Crystal"),
			image: "/assets/temple-of-inversion/reward.png",
			position: { x: 26, y: 40 },
		},
		hero: { image: "/assets/temple-of-inversion/hero.png" },
	},

	"the-jewelers-workshop": {
		id: "the-jewelers-workshop",
		title: msg("The Jeweler's Workshop"),
		description: msg(
			"The Master Jeweler teaches Alarion to set the raw Crystal (Context) into the Necklace (Component). This represents the ContextConsumer: linking the component to data provided from above, transforming separate parts into a unified masterpiece.",
		),
		problemTitle: msg("Before: Hardcoded Dependency"),
		problemDesc: msg(
			"The component creates its own service instance, ignoring the provider.",
		),
		solutionTitle: msg("After: Context Consumption"),
		architecturalChanges: [
			msg(
				"Dependency Injection: The component receives its dependency from the context.",
			),
			msg(
				"Decoupling: The component doesn't know who provides the service, only that it is provided.",
			),
		],
		codeSnippets: {
			start: [
				{
					title: msg("Logic is coupled to the component"),
					code: `export class ProductItem extends LitElement {
    // ❌ Logic is coupled to the component
    // How do I get the service?
    #service = {
        fetchProductData: (id) => {
            return fetch('https://legacycorp.com/product-data')
                .then(res => res.json())
                .catch(err => this.product = {
                    name: 'Error',
                    description: 'Failed to load data'
                })
                .then(data => this.product = data);
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this.#service.fetchProductData(1);
    }

    //...
}`,
				},
			],

			end: [
				{
					title: msg("Consume the context"),
					code: `import { ContextConsumer } from '@lit/context';
import { productContext } from './contexts/product-context.js';

export class ProductItem extends LitElement {
    /** @type {import("../../../services/user-services.js").IUserService | undefined} */
    service;

    connectedCallback() {
        new ContextConsumer(this, {
            context: productContext,
            subscribe: true,
            callback: (productService) => {
                this.#service = productService;
                this.#service.fetchData().then(data => this.product = data);
            }
        });
    }

    // ...
}`,
				},
			],
		},
		stats: { maintainability: 85, portability: 85 },
		serviceType: /** @type {any} */ (null),
		startPos: { x: 50, y: 10 },
		exitZone: {
			x: 50,
			y: 95,
			width: 20,
			height: 10,
			label: msg("Training Room"),
		},
		backgroundStyle: `url('/assets/the-jewelers-workshop/background.png')`,
		npc: {
			name: msg("The Master Jeweler"),
			icon: "link",
			image: "/assets/the-jewelers-workshop/npc.png",
			position: { x: 20, y: 20 },
		},
		reward: {
			name: msg("Necklace"),
			image: "/assets/the-jewelers-workshop/reward.png",
			position: { x: 50, y: 55 },
		},
		hero: {
			image: "/assets/the-jewelers-workshop/hero.png",
			reward: "/assets/the-jewelers-workshop/hero-reward.png",
		},
	},

	"assay-chamber": {
		id: "assay-chamber",
		title: msg("The Assay Chamber"),
		description: msg(
			"The Grand Appraiser uses a Lantern of Emulation (Mock Provider) to test the necklace without risking the real gem. This teaches the value of Mocking: validating the component in a controlled, isolated environment.",
		),
		problemTitle: msg("Before: Hard Dependency"),
		problemDesc: msg(
			"Testing with the real legacy service is slow, flaky, and requires a network connection.",
		),
		solutionTitle: msg("After: Mock Provider"),
		architecturalChanges: [
			msg(
				"Isolation: We can test the component without external dependencies.",
			),
			msg("Speed: Tests run instantly without network requests."),
			msg(
				"Predictability: We control the data returned by the mock (The Yellow Light).",
			),
		],
		codeSnippets: {
			start: [
				{
					title: msg("Testing with real service"),
					code: `import { ProductItem } from './product-item.js';

// ⚠️ Slow, flaky, requires backend
// ⚠️ Mock fetch (¿Service Worker?)
// ⚠️ Hard to test error states
// ⚠️ Mock a private method
// ...`,
				},
			],
			end: [
				{
					title: msg("Create the provider MOCK"),
					code: `import { ContextProvider } from '@lit/context';
import { productContext } from './contexts/product-context.js';

export class ProductProviderMock extends LitElement {

    #productContext = new ContextProvider(this, { context: productContext });

    #service = {
        fetchProductData: (id) => {
            switch (id) {
                case 1:
                    return {
                        name: 'MOCK',
                        description: 'MOCK'
                    };
                default:
                    return {
                        name: 'ERROR',
                        description: 'ERROR'
                    };
            }
        }
    };

    constructor() {
        super();
        this.#productContext.setValue(this.#service);
    }
}`,
				},
			],
		},
		stats: { maintainability: 90, portability: 90 },
		serviceType: ServiceType.MOCK,
		startPos: { x: 50, y: 10 },
		exitZone: {
			x: 50,
			y: 95,
			width: 20,
			height: 10,
			label: msg("Liberated Battlefield"),
		},
		backgroundStyle: `url('/assets/assay-chamber/background.png')`,
		npc: {
			name: msg("Grand Appraiser"),
			icon: "crosshair",
			image: "/assets/assay-chamber/npc.png",
			position: { x: 80, y: 20 },
		},
		reward: {
			name: msg("Amber Gem"),
			image: "/assets/assay-chamber/reward.png",
			position: { x: 69, y: 52 },
		},
		hero: { image: "/assets/assay-chamber/hero.png" },
	},

	"liberated-battlefield": {
		id: "liberated-battlefield",
		title: msg("Liberated Battlefield"),
		description: msg(
			"The final structure blocking the way forward. Interacting triggers the final sequence: the Hot Switch (swapping the Legacy Crystal for the New Blue Crystal) and the demonstration of 100% Portability.",
		),
		zones: [
			{
				x: 50,
				y: 40,
				width: 50,
				height: 60,
				type: "CONTEXT_CHANGE",
				payload: "legacy",
			},
			{
				x: 0,
				y: 40,
				width: 50,
				height: 60,
				type: "CONTEXT_CHANGE",
				payload: "new",
			},
			{
				x: 0,
				y: 0,
				width: 100,
				height: 40,
				type: "CONTEXT_CHANGE",
				payload: null,
			},
		],

		problemTitle: msg("Before: Static Configuration"),
		problemDesc: msg(
			"Changing the service implementation requires code changes and recompilation.",
		),
		solutionTitle: msg("After: Dynamic Injection"),
		architecturalChanges: [
			msg("Portability: We can swap the backend without touching the UI code."),
			msg("Agility: We can A/B test different implementations easily."),
			msg(
				"Future-Proofing: The application is ready for any future backend changes.",
			),
		],
		codeSnippets: {
			start: [
				{
					title: msg("Legacy Context"),
					code: `<product-provider-legacy>
    <product-item></product-item>
</product-provider-legacy>`,
				},
			],
			end: [
				{
					title: msg("New Context"),
					code: `<product-provider-new>
    <product-item></product-item>
</product-provider-new>`,
				},
				{
					title: msg("Other Context"),
					code: `<product-provider-other>
    <product-item></product-item>
</product-provider-other>`,
				},
			],
		},
		stats: { maintainability: 100, portability: 100 },
		serviceType: /** @type {any} */ (null),
		startPos: { x: 95, y: 30 },
		exitZone: { x: 50, y: 10, width: 20, height: 10, label: msg("Victory") },
		postDialogBackgroundStyle: `url('/assets/liberated-battlefield/background_end.png')`,
		backgroundStyle: `url('/assets/liberated-battlefield/background.png')`,
		npc: {
			name: msg("Oracle"),
			icon: "eye",
			image: "/assets/liberated-battlefield/npc.png",
			position: { x: 50, y: 70 },
			requirements: {
				hotSwitchState: { value: "new", message: msg("REQ: NEW API") },
			},
		},
		reward: {
			name: msg("Key"),
			image: "/assets/liberated-battlefield/reward.png",
			position: { x: 50, y: 47 },
		},
		hero: {
			image: "/assets/liberated-battlefield/hero.png",
		},
	},
});
