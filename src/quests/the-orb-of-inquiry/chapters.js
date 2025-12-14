import { ServiceType } from '../../types.js';

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

export const THE_ORB_OF_INQUIRY_CHAPTERS = {
    'hall-of-definition': {
        id: 'hall-of-definition',
        title: "Hall of Definition",
        description: "Alarion enters the Hall of Definition to learn how to forge abstract service contracts. Before injecting, we must define 'what' a service does, not 'how'. This creates a clear blueprint for any backend interaction.",
        problemTitle: "Before: The Concrete Dependency",
        problemDesc: "Component logic assumes direct interaction with fetch or a specific global object. No clear public interface for backend services. Lack of predictability and direct coupling to implementation details, not abstract needs.",
        solutionTitle: "After: The Interface Contract",
        architecturalChanges: [
            "Contract First: We define an abstract interface (what the service does).",
            "Clarity Gained: The component now expects a service that adheres to this clear contract.",
            "Preparation for IoC: This blueprint is the foundation for injecting any compliant service.",
            "Future-Proof: Any future backend service must implement this contract, ensuring compatibility."
        ],
        codeSnippets: {
            end: [{
                title: "Interface Abstraction",
                code: `export class IProductService {
    // The Contract
    fetchProductData(id) {
        throw new Error("Method 'fetchProductData' must be implemented.");
    }
}

// Component depends on Interface, not Concrete Class`}]
        },
        stats: { maintainability: 45, portability: 50 },
        serviceType: null,
        startPos: { x: 5, y: 50 },
        exitZone: { x: 95, y: 50, width: 10, height: 20, label: 'Temple of Inversion' },
        backgroundStyle: `url('/assets/hall-of-definition/background.png') center / cover no-repeat`,
        npc: { name: "Architect", icon: "pen-tool", image: "/assets/hall-of-definition/npc.png", position: { x: 70, y: 20 } },
        reward: { name: "Codex", icon: "book", image: "/assets/hall-of-definition/reward.png", position: { x: 50, y: 20 } },
        hero: { image: "/assets/hall-of-definition/hero.png", reward: "/assets/hall-of-definition/hero-reward.png" }
    },

    'temple-of-inversion': {
        id: 'temple-of-inversion',
        title: "Temple of Inversion",
        description: "The Purveyor, master of the supply chain, demonstrates the power of Context Provision. By installing the Red Focus Crystal (Legacy Service) into the Altar, they establish a data source that flows downwards, available to any component that requests it.",
        problemTitle: "Before: Component Coupling",
        problemDesc: "The service is tightly coupled to the component, making it impossible to share the instance or swap the implementation.",
        solutionTitle: "Context Provider",
        architecturalChanges: [
            "Inversion of Control: The parent provides the dependency, the child consumes it.",
            "Decoupling: Intermediate components don't need to know about the service.",
            "Flexibility: We can provide different implementations at different levels."
        ],
        codeSnippets: {
            start: [{
                title: "Tightly coupled",
                code: `export class ProductItem extends LitElement {
    /* ... */
    #service = {
        fetchProductData: (id) => { /* ... */ }
    };
    /* ... */
}`
            }],
            end: [{
                title: "Create the Context",
                code: `import { createContext } from '@lit/context';
export const productContext = createContext('product');`,
            }, {
                title: "Create the Provider",
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
`
            }],
        },
        stats: { maintainability: 80, portability: 80 },
        serviceType: null,
        startPos: { x: 50, y: 10 },
        exitZone: { x: 50, y: 90, width: 20, height: 10, label: "The Jeweler's Workshop" },
        backgroundStyle: `url('/assets/temple-of-inversion/background.png') center / cover no-repeat`,
        npc: { name: "Purveyor", icon: "shopping-bag", image: "/assets/temple-of-inversion/npc.png", position: { x: 30, y: 50 } },
        reward: { name: "Crystal", icon: "gem", image: "/assets/temple-of-inversion/reward.png", position: { x: 26, y: 40 } },
        hero: { image: "/assets/temple-of-inversion/hero.png" }
    },

    'the-jewelers-workshop': {
        id: 'the-jewelers-workshop',
        title: "The Jeweler's Workshop",
        description: "Alarion enters the quiet precision of the Jeweler's Workshop. Here, the Master Jeweler teaches the art of setting the raw Crystal (the Provider's Context) into the golden frame of the Necklace (the Component). This delicate process represents the ContextConsumer: just as the setting holds the gem, the Consumer controller links the component to the data provided from above, transforming separate parts into a unified, functional masterpiece.", problemTitle: "Before: Hardcoded Dependency",
        problemDesc: "The component creates its own service instance, ignoring the provider.",
        solutionTitle: "After: Context Consumption",
        architecturalChanges: [
            "Dependency Injection: The component receives its dependency from the context.",
            "Decoupling: The component doesn't know who provides the service, only that it is provided."
        ],
        codeSnippets: {
            start: [{
                title: "Logic is coupled to the component",
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
}`
            }],

            end: [{
                title: "Consume the context",
                code: `import { ContextConsumer } from '@lit/context';
import { productContext } from './contexts/product-context.js';

export class ProductItem extends LitElement {
    /** @type {IUserService | undefined} */
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
}`}]
        },
        stats: { maintainability: 85, portability: 85 },
        serviceType: null,
        startPos: { x: 50, y: 10 },
        exitZone: { x: 50, y: 95, width: 20, height: 10, label: 'Training Room' },
        backgroundStyle: `url('/assets/the-jewelers-workshop/background.png') center / cover no-repeat`,
        npc: { name: "The Master Jeweler", icon: "link", image: "/assets/the-jewelers-workshop/npc.png", position: { x: 20, y: 20 } },
        reward: { name: "Necklace", icon: "link-2", image: "/assets/the-jewelers-workshop/reward.png", position: { x: 50, y: 55 } },
        hero: { image: "/assets/the-jewelers-workshop/hero.png", reward: "/assets/the-jewelers-workshop/hero-reward.png" }
    },

    'assay-chamber': {
        id: 'assay-chamber',
        title: "The Assay Chamber",
        description: "Alarion presents the newly assembled necklace to The Grand Appraiser. To prove the craftsmanship is sound without risking the real gem, the Appraiser uses a Lantern of Emulation (Mock Provider). Under this specific light, the crystal glows a safe, warm Yellow. This teaches the value of Mocking: testing the component's reaction in a controlled, isolated environment.",
        problemTitle: "Before: Hard Dependency",
        problemDesc: "Testing with the real legacy service is slow, flaky, and requires a network connection.",
        solutionTitle: "After: Mock Provider",
        architecturalChanges: [
            "Isolation: We can test the component without external dependencies.",
            "Speed: Tests run instantly without network requests.",
            "Predictability: We control the data returned by the mock (The Yellow Light)."
        ],
        codeSnippets: {
            start: [{
                title: "Testing with real service",
                code: `import { ProductItem } from './product-item.js';

// ⚠️ Slow, flaky, requires backend
// ⚠️ Mock fetch (¿Service Worker?)
// ⚠️ Hard to test error states
// ⚠️ Mock a private method
// ...`,
            }],
            end: [{
                title: "Create the provider MOCK",
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
}`
            }]
        },
        stats: { maintainability: 90, portability: 90 },
        serviceType: ServiceType.MOCK,
        startPos: { x: 50, y: 10 },
        exitZone: { x: 50, y: 95, width: 20, height: 10, label: 'Liberated Battlefield' },
        backgroundStyle: `url('/assets/assay-chamber/background.png') center / cover no-repeat`,
        npc: { name: "Grand Appraiser", icon: "crosshair", image: "/assets/assay-chamber/npc.png", position: { x: 80, y: 20 } },
        reward: { name: "Amber Gem", icon: "sun", image: "/assets/assay-chamber/reward.png", position: { x: 69, y: 52 } },
        hero: { image: "/assets/assay-chamber/hero.png" }
    },

    'liberated-battlefield': {
        id: 'liberated-battlefield',
        title: "Liberated Battlefield",
        description: "The final structure blocking the way forward. Interacting triggers the final sequence: the Hot Switch (swapping the Legacy Crystal for the New Blue Crystal) and the demonstration of 100% Portability.",
        hasHotSwitch: true,
        isFinalBoss: true,
        problemTitle: "Before: Static Configuration",
        problemDesc: "Changing the service implementation requires code changes and recompilation.",
        solutionTitle: "After: Dynamic Injection",
        architecturalChanges: [
            "Portability: We can swap the backend without touching the UI code.",
            "Agility: We can A/B test different implementations easily.",
            "Future-Proofing: The application is ready for any future backend changes."
        ],
        codeSnippets: {
            start: [
                {
                    title: "Legacy Context",
                    code: `<product-provider-legacy>
    <product-item></product-item>
</product-provider-legacy>` }
            ],
            end: [
                {
                    title: "New Context",
                    code: `<product-provider-new>
    <product-item></product-item>
</product-provider-new>`
                },
                {
                    title: "Other Context",
                    code: `<product-provider-other>
    <product-item></product-item>
</product-provider-other>`
                }
            ]
        },
        stats: { maintainability: 100, portability: 100 },
        serviceType: null,
        startPos: { x: 95, y: 30 },
        exitZone: { x: 50, y: 10, width: 20, height: 10, label: 'Victory' },
        postDialogBackgroundStyle: `url('/assets/liberated-battlefield/background_end.png') center / cover no-repeat`,
        backgroundStyle: `url('/assets/liberated-battlefield/background.png') center / cover no-repeat`,
        npc: { name: "Oracle", icon: "eye", image: "/assets/liberated-battlefield/npc.png", position: { x: 50, y: 70 } },
        reward: {
            name: "Key",
            icon: "key",
            image: "/assets/liberated-battlefield/reward.png",
            position: { x: 50, y: 47 }
        },
        hero: {
            image: "/assets/liberated-battlefield/hero.png"
        }
    }
};