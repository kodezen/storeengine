import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
	const { pathname, search } = useLocation();

	useEffect( () => {
		if ( window.history.state?.scrollRestore ) {
			return;
		}
		window.scrollTo( {
			top: 0,
			behavior: 'smooth',
		} );
	}, [ pathname, search ] );

	return null;
};

export default ScrollToTop;
