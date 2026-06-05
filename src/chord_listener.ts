import { isModifier, KeyChord } from "../keys";

export class ChordListener {
	// The callback that is invoked when a chord is pressed
	onChord: (cs: KeyChord) => boolean;
	handleKeydown: (e: KeyboardEvent) => void;
	handleKeyup: (e: KeyboardEvent) => void;

	_lastKeydown: KeyboardEvent | undefined;

	constructor(onChord: (cs: KeyChord) => boolean) {
		this.onChord = onChord;

		this.handleKeydown = (event: KeyboardEvent) => {
			// Store the event
			this._lastKeydown = event;

			if (isModifier(event.code)) {
				return;
			}

			this.chordPress(event);
		};

		this.handleKeyup = (event: KeyboardEvent) => {
			// If the chord was not handled yet, because it consists
			// of modifiers only, handle it now.

			// WHY: Electron's before-input-event hook intercepts keydown for certain
			// key combinations (e.g. Ctrl+S) before they reach the DOM renderer,
			// but keyup events are not intercepted. When a non-modifier keyup
			// arrives with modifiers held and no stored keydown was seen, fall
			// back to synthesizing the chord from the keyup event. Without this,
			// sequence chords whose keydown is intercepted by Electron (like
			// Ctrl+S when used as the second chord in a sequence) would be
			// silently lost.
			if (
				!isModifier(event.code) &&
				!this._lastKeydown &&
				(event.ctrlKey || event.metaKey || event.altKey)
			) {
				this._lastKeydown = event;
			}

			this.chordPress(event);
		};
		document.addEventListener("keydown", this.handleKeydown, { capture: true });
		document.addEventListener("keyup", this.handleKeyup, { capture: true });
	}

	chordPress = (event: KeyboardEvent) => {
		if (!!this._lastKeydown) {
			if (this.onChord(new KeyChord(this._lastKeydown))) {
				event.preventDefault();
				event.stopPropagation();
			}
			this._lastKeydown = undefined;
		}
	};

	destruct = () => {
		document.removeEventListener("keydown", this.handleKeydown, { capture: true });
		document.removeEventListener("keyup", this.handleKeyup, { capture: true });
	};
}
