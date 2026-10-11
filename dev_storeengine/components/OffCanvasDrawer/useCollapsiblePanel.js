import { useEffect, useState } from 'react';

const durationStart = 1;
const durationEnd = 200; // Equals to the CSS transition duration

const useCollapsiblePanel = () => {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ animationOnStart, setAnimationOnStart ] = useState( false );
	const [ animationOnEnd, setAnimationOnEnd ] = useState( false );

	const handleOpen = () => {
		setIsOpen( true );
	};

	const handleClose = () => {
		setAnimationOnEnd( true );
		setTimeout( () => {
			setIsOpen( false );
			setAnimationOnStart( false );
		}, durationEnd );
	};

	useEffect( () => {
		if ( isOpen ) {
			setAnimationOnEnd( false );
			setTimeout( () => setAnimationOnStart( true ), durationStart );
		}
	}, [ isOpen ] );

	const isAnimating = animationOnStart && ! animationOnEnd;

	return { handleClose, handleOpen, isAnimating, isOpen };
};

export default useCollapsiblePanel;
