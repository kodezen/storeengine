import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import store from './store';
import { registerOfflineShell } from './offline-shell';
import './styles.scss';

document.addEventListener( 'DOMContentLoaded', () => {
	const node = document.getElementById( 'storeengine-pos-app' );
	if ( ! node ) return;
	const config = window.storeenginePosTerminal || {};
	createRoot( node ).render(
		<Provider store={ store }>
			<App config={ config } />
		</Provider>
	);

	// Best-effort offline-shell registration — no-op until the service
	// worker file ships. See offline-shell.js for the roadmap.
	registerOfflineShell();
} );
