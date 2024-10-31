const SET_CARD = 'SET_CARD'
const SET_READER_SETTINGS = 'SET_READER_SETTINGS'
const SET_SHOW_DECODE = 'SET_SHOW_DECODE'
const SET_SHOW_SETTINGS = 'SET_SHOW_SETTINGS'
const SET_REVERSE = 'SET_REVERSE'
const SET_CONNECTED = 'SET_CONNECTED'
const SET_INVERT_BITS = 'SET_INVERT_BITS'

const INITIAL_CARD_STATE = {
	inputHex: '',
	dispHex: '',
	orderedHex: '',
	bits: 0,
	binary: '',
	dispBinary: '',
	invertedBinary: '',
	decodeBinary: [],
	decodeLength: 0,
	cardNumber: 0,
	facilityCode: 0,
	cardBits: '',
	cardChunk: '',
	facilityBits: '',
	facilityChunk: '',
	fontSize: 14.5,
}
const INITIAL_READER_SETTING_STATE = {
	cardStart: 0,
	cardLength: 0,
	facilityStart: 0,
	facilityLength: 0,
}
const INITIAL_SETTINGS_STATE = {
	showDecode: false,
	showSettings: false,
	reverse: true,
	connected: false,
	invertBits: false,
}

const COMMON_CARD_FORMATS = [
	{
		format: '',
		bits: 0,
		fcStart: 0,
		fcLength: 0,
		cnStart: 0,
		cnLength: 0,
	},
	{
		format: 'HID 26-bit H10301',
		bits: 26,
		fcStart: 2,
		fcLength: 8,
		cnStart: 10,
		cnLength: 16,
	},
	{
		format: 'Corporate 1000 - 35-bit',
		bits: 35,
		fcStart: 3,
		fcLength: 12,
		cnStart: 15,
		cnLength: 20,
	},
	{
		format: 'HID 36-bit C15001',
		bits: 36,
		fcStart: 12,
		fcLength: 8,
		cnStart: 20,
		cnLength: 16,
	},
	{
		format: 'HID 37-bit H10302',
		bits: 37,
		fcStart: 0,
		fcLength: 0,
		cnStart: 2,
		cnLength: 35,
	},
	{
		format: 'HID 37-bit H10304',
		bits: 37,
		fcStart: 2,
		fcLength: 16,
		cnStart: 18,
		cnLength: 19,
	},
	{
		format: 'Corporate 1000 - 48-bit',
		bits: 48,
		fcStart: 3,
		fcLength: 22,
		cnStart: 25,
		cnLength: 23,
	},
]

module.exports = {
	SET_CARD,
	SET_READER_SETTINGS,
	SET_SHOW_DECODE,
	SET_SHOW_SETTINGS,
	SET_REVERSE,
	SET_CONNECTED,
	SET_INVERT_BITS,
	INITIAL_CARD_STATE,
	INITIAL_READER_SETTING_STATE,
	INITIAL_SETTINGS_STATE,
	COMMON_CARD_FORMATS,
}
