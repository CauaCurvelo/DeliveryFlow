// Mock setImmediate para ambiente de teste
if (typeof window !== 'undefined') {
	window.setImmediate = window.setImmediate || ((cb) => setTimeout(cb, 0));
}
// Mock window.io para evitar erro de WebSocket em ambiente de teste
if (typeof window !== 'undefined') {
	window.io = () => ({ on: () => {}, emit: () => {}, disconnect: () => {} });
}
// Mock do Toaster do sonner para evitar warnings de act nos testes
jest.mock('sonner', () => ({
	Toaster: () => null,
	Toast: () => null,
	toast: {
		success: jest.fn(),
		error: jest.fn(),
		info: jest.fn(),
		warning: jest.fn(),
	},
}));
// Mock Radix UI Portal para garantir que o modal seja renderizado no mesmo container do teste
const React = require("react");
jest.mock("@radix-ui/react-portal", () => ({
	...jest.requireActual("@radix-ui/react-portal"),
	Portal: React.forwardRef(function PortalMock(props, ref) {
		return React.createElement(React.Fragment, null, props.children);
	}),
}));

// Mock DialogOverlay e DialogContent para remover animações
// Mock FocusScope do Radix UI para evitar travamento de foco
jest.mock("@radix-ui/react-focus-scope", () => ({
	__esModule: true,
	default: ({ children }) => children,
	FocusScope: ({ children }) => children,
}));
jest.mock("@radix-ui/react-dialog", () => {
	const actual = jest.requireActual("@radix-ui/react-dialog");
	return {
		...actual,
		Overlay: React.forwardRef(function OverlayMock(props, ref) {
			return React.createElement("div", { ref, ...props, className: "" }, props.children);
		}),
		Content: React.forwardRef(function ContentMock(props, ref) {
			return React.createElement("div", { ref, ...props, className: "" }, props.children);
		}),
	};
});
require('@testing-library/jest-dom');


// Mock requestAnimationFrame e setTimeout para evitar travamento de animações e timers
if (typeof global !== 'undefined') {
		jest.spyOn(global, 'requestAnimationFrame').mockImplementation(cb => setTimeout(cb, 0));
}

// Mock global fetch para ambiente de testes (jsdom), exceto quando JEST_WORKER_ID está definido (ambiente de teste)
const isTest = typeof process !== 'undefined' && process.env.JEST_WORKER_ID !== undefined;
if (!isTest) {
	const fetchMock = require('jest-fetch-mock');
	global.fetch = fetchMock;
	fetchMock.enableMocks();
	fetchMock.mockResponse(JSON.stringify([])); // Retorna array vazio por padrão
}

// Mock window.matchMedia e ResizeObserver para ambiente de testes
if (typeof window !== 'undefined') {
	window.matchMedia = window.matchMedia || function() {
		return {
			matches: false,
			addListener: function() {},
			removeListener: function() {},
		};
	};
	// Mock window.io (socket.io client)
	window.io = jest.fn(() => ({ on: jest.fn(), emit: jest.fn(), disconnect: jest.fn() }));
	// Mock ResizeObserver
	global.ResizeObserver = global.ResizeObserver || class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};

	// PointerEvent shim
	if (!window.PointerEvent) {
		window.PointerEvent = window.MouseEvent;
	}

	// DOMRect shim
	if (!window.DOMRect) {
		window.DOMRect = class DOMRect {
			static fromRect() {
				return { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 };
			}
		};
	}

	// scrollIntoView shim
	window.HTMLElement.prototype.scrollIntoView = function () {};

	// hasPointerCapture shim
	window.HTMLElement.prototype.hasPointerCapture = function () { return true; };

	// releasePointerCapture shim
	window.HTMLElement.prototype.releasePointerCapture = function () {};
}