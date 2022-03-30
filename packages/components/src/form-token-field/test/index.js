/**
 * External dependencies
 */
import { filter, map } from 'lodash';
import TestUtils, { act } from 'react-dom/test-utils';

/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import fixtures from './lib/fixtures';
import TokenFieldWrapper from './lib/token-field-wrapper';

/**
 * Module variables
 */
const keyCodes = {
	backspace: 8,
	tab: 9,
	enter: 13,
	leftArrow: 37,
	upArrow: 38,
	rightArrow: 39,
	downArrow: 40,
	delete: 46,
	comma: 188,
};

const charCodes = {
	comma: 44,
};

describe( 'FormTokenField', () => {
	let textInputElement;
	let wrapperElement;
	let wrapperRef;

	function setText( text ) {
		TestUtils.Simulate.change( textInputElement(), {
			target: {
				value: text,
			},
		} );
		jest.runAllTimers();
	}

	function sendKeyDown( keyCode, shiftKey ) {
		TestUtils.Simulate.keyDown( wrapperElement(), {
			keyCode,
			shiftKey: !! shiftKey,
		} );
		jest.runAllTimers();
	}

	function sendKeyPress( charCode ) {
		TestUtils.Simulate.keyPress( wrapperElement(), { charCode } );
		jest.runAllTimers();
	}

	function getTokensHTML() {
		const textNodes = wrapperElement().querySelectorAll(
			'.components-form-token-field__token-text span[aria-hidden]'
		);
		return map( textNodes, ( node ) => node.innerHTML );
	}

	function getSuggestionsText( selector ) {
		const suggestionNodes = wrapperElement().querySelectorAll(
			selector || '.components-form-token-field__suggestion'
		);

		return map( suggestionNodes, getSuggestionNodeText );
	}

	function getSuggestionNodeText( node ) {
		if ( ! node.querySelector( 'span' ) ) {
			return node.outerHTML;
		}

		// This suggestion is part of a partial match; return up to three
		// sections of the suggestion (before match, match, and after
		// match).
		const div = document.createElement( 'div' );
		div.innerHTML = node.querySelector( 'span' ).outerHTML;
		return map(
			filter(
				div.firstChild.childNodes,
				( childNode ) => childNode.nodeType !== childNode.COMMENT_NODE
			),
			( childNode ) => childNode.textContent
		);
	}

	function getSelectedSuggestion() {
		const selectedSuggestions = getSuggestionsText(
			'.components-form-token-field__suggestion.is-selected'
		);

		return selectedSuggestions[ 0 ] || null;
	}

	function setUp( props ) {
		const container = document.createElement( 'div' );
		const root = createRoot( container );
		wrapperRef = { current: null };
		root.render( <TokenFieldWrapper ref={ wrapperRef } { ...props } /> );
		jest.runAllTimers();
		wrapperElement = () => container.firstChild;
		textInputElement = () =>
			container.querySelector( '.components-form-token-field__input' );
		TestUtils.Simulate.focus( textInputElement() );
		jest.runAllTimers();
	}

	describe( 'displaying tokens', () => {
		it( 'should render default tokens', () => {
			setUp();
			wrapperRef.current.setState( {
				isExpanded: true,
			} );
			jest.runAllTimers();
			expect( wrapperRef.current.state.tokens ).toEqual( [
				'foo',
				'bar',
			] );
		} );

		it( 'should display tokens with escaped special characters properly', () => {
			setUp();
			wrapperRef.current.setState( {
				tokens: fixtures.specialTokens.textEscaped,
				isExpanded: true,
			} );
			jest.runAllTimers();
			expect( getTokensHTML() ).toEqual(
				fixtures.specialTokens.htmlEscaped
			);
		} );

		it( 'should display tokens with special characters properly', () => {
			setUp();
			// This test is not as realistic as the previous one: if a WP site
			// contains tag names with special characters, the API will always
			// return the tag names already escaped.  However, this is still
			// worth testing, so we can be sure that token values with
			// dangerous characters in them don't have these characters carried
			// through unescaped to the HTML.
			wrapperRef.current.setState( {
				tokens: fixtures.specialTokens.textUnescaped,
				isExpanded: true,
			} );
			jest.runAllTimers();
			expect( getTokensHTML() ).toEqual(
				fixtures.specialTokens.htmlUnescaped
			);
		} );
	} );

	describe( 'suggestions', () => {
		it( 'should not render suggestions unless we type at least two characters', () => {
			setUp();
			wrapperRef.current.setState( {
				isExpanded: true,
			} );
			jest.runAllTimers();
			expect( getSuggestionsText() ).toEqual( [] );
			setText( 'th' );
			expect( getSuggestionsText() ).toEqual(
				fixtures.matchingSuggestions.th
			);
		} );

		it( 'should show suggestions when when input is empty if expandOnFocus is set to true', () => {
			setUp( { __experimentalExpandOnFocus: true } );
			wrapperRef.current.setState( {
				isExpanded: true,
			} );
			jest.runAllTimers();
			expect( getSuggestionsText() ).not.toEqual( [] );
		} );

		it( 'should remove already added tags from suggestions', () => {
			setUp();
			wrapperRef.current.setState( {
				tokens: Object.freeze( [ 'of', 'and' ] ),
			} );
			jest.runAllTimers();
			expect( getSuggestionsText() ).not.toEqual( getTokensHTML() );
		} );

		it( 'suggestions that begin with match are boosted', () => {
			setUp();
			wrapperRef.current.setState( {
				isExpanded: true,
			} );
			jest.runAllTimers();
			setText( 'so' );
			expect( getSuggestionsText() ).toEqual(
				fixtures.matchingSuggestions.so
			);
		} );

		it( 'should match against the unescaped values of suggestions with special characters', () => {
			setUp();
			wrapperRef.current.setState( {
				tokenSuggestions: fixtures.specialSuggestions.textUnescaped,
				isExpanded: true,
			} );
			jest.runAllTimers();
			setText( '& S' );
			expect( getSuggestionsText() ).toEqual(
				fixtures.specialSuggestions.matchAmpersandUnescaped
			);
		} );

		it( 'should match against the unescaped values of suggestions with special characters (including spaces)', () => {
			setUp();
			wrapperRef.current.setState( {
				tokenSuggestions: fixtures.specialSuggestions.textUnescaped,
				isExpanded: true,
			} );
			jest.runAllTimers();
			setText( 's &' );
			expect( getSuggestionsText() ).toEqual(
				fixtures.specialSuggestions.matchAmpersandSequence
			);
		} );

		it( 'should not match against the escaped values of suggestions with special characters', () => {
			setUp();
			setText( 'amp' );
			wrapperRef.current.setState( {
				tokenSuggestions: fixtures.specialSuggestions.textUnescaped,
				isExpanded: true,
			} );
			jest.runAllTimers();
			expect( getSuggestionsText() ).toEqual(
				fixtures.specialSuggestions.matchAmpersandEscaped
			);
		} );

		it( 'should match suggestions even with trailing spaces', () => {
			setUp();
			wrapperRef.current.setState( {
				isExpanded: true,
			} );
			jest.runAllTimers();
			setText( '  at  ' );
			expect( getSuggestionsText() ).toEqual(
				fixtures.matchingSuggestions.at
			);
		} );

		it( 'should manage the selected suggestion based on both keyboard and mouse events', () => {
			setUp();
			wrapperRef.current.setState( {
				isExpanded: true,
			} );
			jest.runAllTimers();
			setText( 'th' );
			expect( getSuggestionsText() ).toEqual(
				fixtures.matchingSuggestions.th
			);
			expect( getSelectedSuggestion() ).toBe( null );
			sendKeyDown( keyCodes.downArrow ); // 'the'.
			expect( getSelectedSuggestion() ).toEqual( [ 'th', 'e' ] );
			sendKeyDown( keyCodes.downArrow ); // 'that'.
			expect( getSelectedSuggestion() ).toEqual( [ 'th', 'at' ] );

			const hoverSuggestion = wrapperElement().querySelectorAll(
				'.components-form-token-field__suggestion'
			)[ 3 ]; // 'with'.
			expect( getSuggestionNodeText( hoverSuggestion ) ).toEqual( [
				'wi',
				'th',
			] );

			// Before sending a hover event, we need to wait for
			// SuggestionList#_scrollingIntoView to become false.
			act( () => {
				jest.advanceTimersByTime( 100 );
			} );

			TestUtils.Simulate.mouseEnter( hoverSuggestion );
			jest.runAllTimers();
			expect( getSelectedSuggestion() ).toEqual( [ 'wi', 'th' ] );
			sendKeyDown( keyCodes.upArrow );
			expect( getSelectedSuggestion() ).toEqual( [ 'th', 'is' ] );
			sendKeyDown( keyCodes.upArrow );
			expect( getSelectedSuggestion() ).toEqual( [ 'th', 'at' ] );
			TestUtils.Simulate.click( hoverSuggestion );
			jest.runAllTimers();
			expect( getSelectedSuggestion() ).toBe( null );
			expect( getTokensHTML() ).toEqual( [ 'foo', 'bar', 'with' ] );
		} );

		it( 'should re-render when suggestions prop has changed', () => {
			setUp();
			wrapperRef.current.setState( {
				tokenSuggestions: [],
				isExpanded: true,
			} );
			jest.runAllTimers();
			expect( getSuggestionsText() ).toEqual( [] );
			setText( 'so' );
			expect( getSuggestionsText() ).toEqual( [] );

			wrapperRef.current.setState( {
				tokenSuggestions: fixtures.specialSuggestions.default,
			} );
			jest.runAllTimers();
			expect( getSuggestionsText() ).toEqual(
				fixtures.matchingSuggestions.so
			);

			wrapperRef.current.setState( {
				tokenSuggestions: [],
			} );
			jest.runAllTimers();
			expect( getSuggestionsText() ).toEqual( [] );
		} );
	} );

	describe( 'adding tokens', () => {
		it( 'should not allow adding blank tokens with Tab', () => {
			setUp();
			sendKeyDown( keyCodes.tab );
			expect( wrapperRef.current.state.tokens ).toEqual( [
				'foo',
				'bar',
			] );
		} );

		it( 'should not allow adding whitespace tokens with Tab', () => {
			setUp();
			setText( '   ' );
			sendKeyDown( keyCodes.tab );
			expect( wrapperRef.current.state.tokens ).toEqual( [
				'foo',
				'bar',
			] );
		} );

		it( 'should add a token when Enter pressed', () => {
			setUp();
			setText( 'baz' );
			sendKeyDown( keyCodes.enter );
			expect( wrapperRef.current.state.tokens ).toEqual( [
				'foo',
				'bar',
				'baz',
			] );
		} );

		it( 'should not allow adding blank tokens with Enter', () => {
			setUp();
			sendKeyDown( keyCodes.enter );
			expect( wrapperRef.current.state.tokens ).toEqual( [
				'foo',
				'bar',
			] );
		} );

		it( 'should not allow adding whitespace tokens with Enter', () => {
			setUp();
			setText( '   ' );
			sendKeyDown( keyCodes.enter );
			expect( wrapperRef.current.state.tokens ).toEqual( [
				'foo',
				'bar',
			] );
		} );

		it( 'should not allow adding whitespace tokens with comma', () => {
			setUp();
			setText( '   ' );
			sendKeyPress( charCodes.comma );
			expect( wrapperRef.current.state.tokens ).toEqual( [
				'foo',
				'bar',
			] );
		} );

		it( 'should add a token when comma pressed', () => {
			setUp();
			setText( 'baz' );
			sendKeyPress( charCodes.comma );
			expect( wrapperRef.current.state.tokens ).toEqual( [
				'foo',
				'bar',
				'baz',
			] );
		} );

		it( 'should trim token values when adding', () => {
			setUp();
			setText( '  baz  ' );
			sendKeyDown( keyCodes.enter );
			expect( wrapperRef.current.state.tokens ).toEqual( [
				'foo',
				'bar',
				'baz',
			] );
		} );

		it( "should not add values that don't pass the validation", () => {
			setUp( {
				__experimentalValidateInput: ( newValue ) => newValue !== 'baz',
			} );
			setText( 'baz' );
			sendKeyDown( keyCodes.enter );
			expect( wrapperRef.current.state.tokens ).toEqual( [
				'foo',
				'bar',
			] );
		} );
	} );

	describe( 'removing tokens', () => {
		it( 'should remove tokens when X icon clicked', () => {
			setUp();
			const forClickNode = wrapperElement().querySelector(
				'.components-form-token-field__remove-token'
			).firstChild;
			TestUtils.Simulate.click( forClickNode );
			jest.runAllTimers();
			expect( wrapperRef.current.state.tokens ).toEqual( [ 'bar' ] );
		} );
	} );
} );
