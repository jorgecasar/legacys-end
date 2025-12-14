import { css, unsafeCSS } from 'lit';
import nativeCss from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilitiesCss from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import syntaxHighlightCss from 'syntax-highlight-element/themes/prettylights.css?inline';

// We need to process the CSS to handle imports since they won't work inside Shadow DOM
// For now, we'll just export the raw CSS content which Vite should handle via ?inline
export const nativeStyles = css`${unsafeCSS(nativeCss)}`;
export const utilityStyles = css`${unsafeCSS(utilitiesCss)}`;
export const syntaxHighlightStyles = css`${unsafeCSS(syntaxHighlightCss)}`;

// Combined styles for convenience
export const sharedStyles = [nativeStyles, utilityStyles, syntaxHighlightStyles];
