import {
	SET_CARD,
	SET_CONNECTED,
	SET_INVERT_BITS,
	SET_READER_SETTINGS,
	SET_REVERSE,
	SET_SHOW_DECODE,
	SET_SHOW_SETTINGS,
} from '../constants'

export const cardReducer = (state, action) => {
	switch (action.type) {
		case SET_CARD:
			return { ...action.value }
		default:
			return state
	}
}

export const readerSettingsReducer = (state, action) => {
	switch (action.type) {
		case SET_READER_SETTINGS:
			return { ...action.value }
		default:
			return state
	}
}

export const settingsReducer = (state, action) => {
	switch (action.type) {
		case SET_CONNECTED:
			return { ...state, connected: action.value }
		case SET_REVERSE:
			return { ...state, reverse: action.value }
		case SET_SHOW_DECODE:
			return { ...state, showDecode: action.value }
		case SET_SHOW_SETTINGS:
			return { ...state, showSettings: action.value }
		case SET_INVERT_BITS:
			return { ...state, invertBits: action.value }
		default:
			return state
	}
}
