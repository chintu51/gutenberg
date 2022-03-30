/**
 * External dependencies
 */
import { act } from 'react-dom/test-utils';

/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TextHighlight from '../index';

let container = null;
let root = null;

beforeEach( () => {
	// Setup a DOM element as a render target.
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	root = createRoot( container );

	// This is needed due to some kind of bug in JSDOM that conflicts with React 18.
	global.IS_REACT_ACT_ENVIRONMENT = true;
} );

afterEach( () => {
	// Cleanup on exiting.
	act( () => {
		root.unmount();
	} );
	container.remove();
	container = null;
} );

const defaultText =
	'We call the new editor Gutenberg. The entire editing experience has been rebuilt for media rich pages and posts.';

describe( 'Basic rendering', () => {
	it.each( [ [ 'Gutenberg' ], [ 'media' ] ] )(
		'should highlight the singular occurance of the text "%s" in the text if it exists',
		( highlight ) => {
			act( () => {
				root.render(
					<TextHighlight
						text={ defaultText }
						highlight={ highlight }
					/>
				);
			} );

			const highlightedEls = Array.from(
				container.querySelectorAll( 'mark' )
			);

			highlightedEls.forEach( ( el ) => {
				expect( el.innerHTML ).toEqual(
					expect.stringContaining( highlight )
				);
			} );
		}
	);

	it( 'should highlight multiple occurances of the string every time it exists in the text', () => {
		const highlight = 'edit';

		act( () => {
			root.render(
				<TextHighlight text={ defaultText } highlight={ highlight } />
			);
		} );

		const highlightedEls = Array.from(
			container.querySelectorAll( 'mark' )
		);

		expect( highlightedEls ).toHaveLength( 2 );

		highlightedEls.forEach( ( el ) => {
			expect( el.innerHTML ).toEqual(
				expect.stringContaining( highlight )
			);
		} );
	} );

	it( 'should highlight occurances of a string regardless of capitalisation', () => {
		const highlight = 'The'; // Note this occurs in both sentance of lowercase forms.

		act( () => {
			root.render(
				<TextHighlight text={ defaultText } highlight={ highlight } />
			);
		} );

		const highlightedEls = Array.from(
			container.querySelectorAll( 'mark' )
		);

		// Our component matcher is case insensitive so string.Containing will
		// return a false failure.
		const regex = new RegExp( highlight, 'i' );

		expect( highlightedEls ).toHaveLength( 2 );

		highlightedEls.forEach( ( el ) => {
			expect( el.innerHTML ).toMatch( regex );
		} );
	} );

	it( 'should not highlight a string that is not in the text', () => {
		const highlight = 'Antidisestablishmentarianism';

		act( () => {
			root.render(
				<TextHighlight text={ defaultText } highlight={ highlight } />
			);
		} );

		const highlightedEls = Array.from(
			container.querySelectorAll( 'mark' )
		);

		expect( highlightedEls ).toHaveLength( 0 );
	} );
} );
