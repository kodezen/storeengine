import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.scss';

document.addEventListener( 'DOMContentLoaded', () => {
	const node = document.getElementById( 'storeengine-customer-returns-app' );
	if ( ! node ) return;
	const config = window.storeengineCustomerReturns || {};
	createRoot( node ).render( <App config={ config } /> );
} );
