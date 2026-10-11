import React from 'react';

const Bar = ( { w = 'w-full', h = 'h-9', extra = '' } ) => (
	<div className={ `storeengine-skeleton-pulse rounded ${ w } ${ h } ${ extra }` } />
);

const Field = () => (
	<div className="mb-4">
		<Bar w="w-[35%]" h="h-3" extra="mb-2" />
		<Bar />
	</div>
);

const Card = ( { fields = 3, headerWidth = 'w-[45%]', extraClass = '' } ) => (
	<div className={ `storeengine-content-section ${ extraClass }` }>
		<Bar w={ headerWidth } h="h-4" extra="mb-5" />
		{ [ ...Array( fields ) ].map( ( _, i ) => <Field key={ i } /> ) }
	</div>
);

export default function AddProductSkeleton() {
	return (
		<div className="storeengine-page-content">
			{ /* SubTopBar placeholder */ }
			<div className="flex items-center justify-between px-6 py-[18px] border-b border-se-border mb-6">
				<Bar w="w-[200px]" h="h-5" />
				<Bar w="w-[120px]" h="h-8" />
			</div>

			{ /* Two-column layout */ }
			<div className="storeengine-page-content--add-product">
				{ /* Left column — Details (tall), Price, Variants, Integration */ }
				<div className="storeengine-page-content__left">
					<Card fields={ 5 } headerWidth="w-[40%]" />
					<Card fields={ 3 } headerWidth="w-[30%]" />
					<Card fields={ 2 } headerWidth="w-[35%]" />
					<Card fields={ 2 } headerWidth="w-[25%]" />
				</div>

				{ /* Right column — Publishing, Shipping, Images */ }
				<div className="storeengine-page-content__right">
					<Card fields={ 2 } headerWidth="w-[50%]" />
					<Card fields={ 3 } headerWidth="w-[40%]" />
					<Card fields={ 1 } headerWidth="w-[35%]" />
				</div>
			</div>
		</div>
	);
}
