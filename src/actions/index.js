import {
	SET_CARD,
	SET_CONNECTED,
	SET_INVERT_BITS,
	SET_READER_SETTINGS,
	SET_REVERSE,
	SET_SHOW_DECODE,
	SET_SHOW_SETTINGS,
} from '../constants'

export const setCard = (value) => ({ type: SET_CARD, value })

export const setSettings = (value) => ({
	type: SET_READER_SETTINGS,
	value,
})

export const setShowDecode = (value) => ({ type: SET_SHOW_DECODE, value })

export const setShowSettings = (value) => ({ type: SET_SHOW_SETTINGS, value })

export const setReverse = (value) => ({ type: SET_REVERSE, value })

export const setConnected = (value) => ({ type: SET_CONNECTED, value })

export const setInvertBits = (value) => ({ type: SET_INVERT_BITS, value })
