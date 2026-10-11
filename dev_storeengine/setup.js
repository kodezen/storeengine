import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import store from './redux/store';
import SetupWizard from './containers/BackendDashboard/SetupWizard';
import Notification from '@Components/Notification';
import '../assets/scss/setup.scss';
// The redesigned wizard is built with the `ui/` kit, whose utilities are
// scoped to `.se-admin-tw`. The setup screen loads its own bundle (setup.css),
// so it must pull in the admin Tailwind layer the same way backend.js does.
import '../assets/scss/admin-tailwind.scss';

document.addEventListener( 'DOMContentLoaded', () => {
	const container = document.getElementById(
		'storeengine_setup_screen_wrap'
	);
	if ( container ) {
		const root = createRoot( container );
		root.render(
			<Provider store={ store }>
				<HashRouter
					basename="/"
					future={ {
						v7_startTransition: true,
						v7_relativeSplatPath: false,
					} }
				>
					<SetupWizard />
					<Notification />
				</HashRouter>
			</Provider>
		);
	}
} );
