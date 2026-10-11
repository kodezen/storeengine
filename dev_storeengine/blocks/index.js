import { registerBlockType } from '@wordpress/blocks';
import metadata from '../../includes/blocks/block.json';
import Edit from './edit';
import './editor.scss';

registerBlockType( metadata.name, {
	title: metadata.title,
	description: metadata.description,
	attributes: metadata.attributes,
	icon: 'shortcode',
	edit: Edit,
	// Dynamic block — server-rendered, nothing to persist.
	save: () => null,
} );
