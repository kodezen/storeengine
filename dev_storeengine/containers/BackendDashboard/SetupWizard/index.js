import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Scope } from '@Components/ui';
import SetupContext from './context/SetupContext';
import Welcome from './pages/Welcome';
import Settings from './pages/Settings';
import Congratulation from './pages/Congratulation';

import './styles.scss';

const propTypes = {};

export default function SetupWizard() {
	// The setup wizard is a standalone full-screen screen (mounted by setup.js),
	// so it opts into the Tailwind `ui/` kit at its root: `.se-admin-tw` scopes
	// every kit utility used by the pages/steps rendered inside it.
	return (
		<Scope>
			<SetupContext.Provider value={ {} }>
				<Routes>
					<Route exact path="/" element={ <Welcome /> } />
					<Route path="/settings" element={ <Settings /> } />
					<Route
						path="/congratulation"
						element={ <Congratulation /> }
					/>
				</Routes>
			</SetupContext.Provider>
		</Scope>
	);
}

SetupWizard.propTypes = propTypes;
