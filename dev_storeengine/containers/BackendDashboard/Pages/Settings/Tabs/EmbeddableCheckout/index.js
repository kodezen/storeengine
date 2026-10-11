import React from 'react';
import { __ } from '@wordpress/i18n';
import Number from '@Components/Formik/Number';
import { useFormikContext } from 'formik';
import { Scope, Heading, Title } from '@Components/ui';
import EmbedKeys from './EmbedKeys';

const DEFAULTS = {
	session_rate_limit: 60,
};

const EmbeddableCheckout = () => {
	useFormikContext(); // ensure subtree re-renders on form value changes

	const sdkUrl = `${ window.location.origin }/se-embed/v1/sdk.js`;

	return (
		<Scope id="settingsEmbeddableCheckout">
			<div className="storeengine-content-section">
				<Heading>
					{ __( 'Embeddable Checkout', 'storeengine' ) }
				</Heading>

				<Title as="p">
					{ __(
						'Lets external sites (landing pages, headless storefronts, partner blogs) embed the same Quick Checkout modal that runs on your storefront. Each external site gets its own embed key locked to a list of allowed origins.',
						'storeengine'
					) }
				</Title>

				<div className="bg-[var(--storeengine-primary-light)] border-se-border rounded-se p-4 my-6">
					<p className="text-sm font-medium text-se-text m-0 mb-2">
						{ __( 'Embed snippet for external sites:', 'storeengine' ) }
					</p>
					<pre className="p-3 bg-se-white border border-se-border rounded-se text-xs text-se-text overflow-x-auto leading-relaxed m-0">
{`<script src="${sdkUrl}"></script>

<button id="buy-btn">Buy Now</button>

<script>
	document.addEventListener("DOMContentLoaded", () => {
		const button = document.getElementById("buy-btn");

		button.addEventListener("click", () => {
			if (!window.StoreEngine) {
				console.error("StoreEngine SDK is not loaded.");
				return;
			}

			try {
				const checkout = new StoreEngine.Checkout({
					embed_key: 'pk_live_…',
					store_url: '${window.location.origin}',
				});

				checkout.open({ product_id: 123 });
			} catch (err) {
				console.error("Checkout error:", err);
			}
		});
	});
</script>`}
</pre>
				</div>

				<hr className="border-se-border my-6" />

				<h3 className="text-base font-semibold text-se-text mb-4">
					{ __( 'Rate limit', 'storeengine' ) }
				</h3>

				<Number
					title={ __(
						'Session rate limit (per key, per minute)',
						'storeengine'
					) }
					name="embeddable_checkout.session_rate_limit"
					suffix="embeddable-checkout-session-rate-limit"
					min={ 1 }
					max={ 1000 }
					subtitle={ __(
						'Maximum number of new checkout sessions an embed key can create per minute.',
						'storeengine'
					) }
				/>
			</div>

			<EmbedKeys />
		</Scope>
	);
};

EmbeddableCheckout.DEFAULTS = DEFAULTS;

export default EmbeddableCheckout;
