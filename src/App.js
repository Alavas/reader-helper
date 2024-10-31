import React, { useReducer, useEffect, Fragment, useRef } from 'react'
import { Button, Card, Col, Input, Row } from 'react-materialize'
import serial from './usb'
import Highlight from './components/Highlight'
import * as actions from './actions'
import { cardReducer, readerSettingsReducer, settingsReducer } from './reducer'
import {
	COMMON_CARD_FORMATS,
	INITIAL_CARD_STATE,
	INITIAL_READER_SETTING_STATE,
	INITIAL_SETTINGS_STATE,
} from './constants'
import { useReactToPrint } from 'react-to-print'

let USBDevice

const Reader = () => {
	const contentRef = useRef(null)
	const reactToPrintFn = useReactToPrint({ contentRef })

	const [cardState, cardDispatch] = useReducer(cardReducer, INITIAL_CARD_STATE)
	const [readerSettingsState, readerSettingDispatch] = useReducer(
		readerSettingsReducer,
		INITIAL_READER_SETTING_STATE
	)
	const [settingsState, settingsDispatch] = useReducer(
		settingsReducer,
		INITIAL_SETTINGS_STATE
	)
	useEffect(() => {
		handleDecodeBits()
	}, [readerSettingsState, settingsState])

	const connectButton = () => {
		if (USBDevice) {
			USBDevice.disconnect()
			USBDevice = null
			settingsDispatch(actions.setConnected(false))
			settingsDispatch(actions.setReverse(true))
		} else {
			serial
				.requestPort()
				.then((selectedPort) => {
					USBDevice = selectedPort
					connectUSB()
					settingsDispatch(actions.setConnected(true))
					settingsDispatch(actions.setReverse(false))
				})
				.catch(() => {
					settingsDispatch(actions.setConnected(false))
					window.Materialize.toast('No USB device selected.', 5000)
				})
		}
	}

	const connectUSB = () => {
		USBDevice.connect().then(
			() => {
				USBDevice.onReceive = (data) => {
					let textDecoder = new TextDecoder()
					let cardJSON = textDecoder.decode(data)
					cardJSON = JSON.parse(cardJSON)
					handleHex(cardJSON.hex)
					handleBits(cardJSON.bits)
				}
				USBDevice.onReceiveError = (error) => {
					window.Materialize.toast(error, 5000)
				}
			},
			(error) => {
				window.Materialize.toast(error, 5000)
			}
		)
	}

	const handleUserInput = (e) => {
		let readerSettings = readerSettingsState
		switch (e.target.id) {
			case 'HEX':
				handleHex(e.target.value)
				break
			case 'BITS':
				handleBits(parseInt(e.target.value))
				break
			case 'CARD':
				handleCardNumber(parseInt(e.target.value))
				break
			case 'FACILITY':
				handleFacilityCode(parseInt(e.target.value))
				break
			case 'SITESTART':
				readerSettings.facilityStart = parseInt(e.target.value)
				readerSettingDispatch(actions.setSettings(readerSettings))
				break
			case 'SITELENGTH':
				readerSettings.facilityLength = parseInt(e.target.value)
				readerSettingDispatch(actions.setSettings(readerSettings))
				break
			case 'CARDSTART':
				readerSettings.cardStart = parseInt(e.target.value)
				readerSettingDispatch(actions.setSettings(readerSettings))
				break
			case 'CARDLENGTH':
				readerSettings.cardLength = parseInt(e.target.value)
				readerSettingDispatch(actions.setSettings(readerSettings))
				break
			case 'FORMAT':
				let format = COMMON_CARD_FORMATS.find(
					(f) => f.format === e.target.value
				)
				readerSettings.facilityStart = format.fcStart
				readerSettings.facilityLength = format.fcLength
				readerSettings.cardStart = format.cnStart
				readerSettings.cardLength = format.cnLength
				readerSettingDispatch(actions.setSettings(readerSettings))
				break
			default:
				break
		}
	}

	const handleDecodeBits = () => {
		if (settingsState.showSettings) {
			let decodeBinaryRaw = '*'.repeat(cardState.bits)
			let decodeBinary = decodeBinaryRaw.split('')
			let facilityChunk = 'F'.repeat(readerSettingsState.facilityLength)
			let cardChunk = 'C'.repeat(readerSettingsState.cardLength)
			let fcStart = readerSettingsState.facilityStart - 1
			let cnStart = readerSettingsState.cardStart - 1
			if (
				readerSettingsState.cardLength > 0 &&
				readerSettingsState.cardStart > 0
			)
				decodeBinary.splice(cnStart, readerSettingsState.cardLength, cardChunk)
			if (
				readerSettingsState.facilityLength > 0 &&
				readerSettingsState.facilityStart > 0
			)
				decodeBinary.splice(
					fcStart,
					readerSettingsState.facilityLength,
					facilityChunk
				)
			// Are we using inverted bits?
			let facilityBits = settingsState.invertBits
				? cardState.invertedBinary.slice(
						fcStart,
						fcStart + readerSettingsState.facilityLength
				  )
				: cardState.dispBinary.slice(
						fcStart,
						fcStart + readerSettingsState.facilityLength
				  )
			let cardBits = settingsState.invertBits
				? cardState.invertedBinary.slice(
						cnStart,
						cnStart + readerSettingsState.cardLength
				  )
				: cardState.dispBinary.slice(
						cnStart,
						cnStart + readerSettingsState.cardLength
				  )
			let decodeLength = decodeBinary.join('').length
			let cardNumber = parseInt(cardBits, 2) || 0
			let facilityCode = parseInt(facilityBits, 2) || 0
			let card = cardState
			card.decodeBinary = decodeBinary
			card.decodeLength = decodeLength
			card.cardNumber = cardNumber
			card.facilityCode = facilityCode
			card.cardBits = cardBits
			card.cardChunk = cardChunk
			card.facilityBits = facilityBits
			card.facilityChunk = facilityChunk
			cardDispatch(actions.setCard(card))
		}
	}

	const handleShowSettings = () => {
		settingsDispatch(actions.setShowSettings(!settingsState.showSettings))
		let card = cardState
		card.cardNumber = null
		card.facilityCode = null
		cardDispatch(actions.setCard(card))
		let readerSettings = readerSettingsState
		readerSettings.facilityStart = 0
		readerSettings.facilityLength = 0
		readerSettings.cardStart = 0
		readerSettings.cardLength = 0
		readerSettingDispatch(actions.setSettings(readerSettings))
		handleFacilityCode(null)
		handleCardNumber(null)
		handleDecodeBits()
	}

	const handleCardNumber = (cardNumber) => {
		let cardBits = parseInt(cardNumber, 10).toString(2)
		let card = cardState
		card.cardBits = cardBits
		card.cardNumber = cardNumber
		cardDispatch(actions.setCard(card))
	}

	const handleFacilityCode = (facilityCode) => {
		let facilityBits = parseInt(facilityCode, 10).toString(2)
		let card = cardState
		card.facilityCode = facilityCode
		card.facilityBits = facilityBits
		cardDispatch(actions.setCard(card))
	}

	const handleBits = (inputBits) => {
		let cut = cardState.binary.length - inputBits
		let displayBinary = cardState.binary.slice(cut)
		// Invert Bits
		let binaryArray = displayBinary.split('')
		binaryArray = binaryArray.map((x) => {
			return x === '0' ? '1' : '0' // Lazy invert...
		})
		let inverted = binaryArray.join('')
		// Resize...
		let fontSize = 14.5
		if (inputBits > 100) {
			fontSize = 1450 / inputBits
		}
		// Update State
		let card = cardState
		card.bits = inputBits
		card.fontSize = fontSize
		card.dispBinary = displayBinary
		card.invertedBinary = inverted
		cardDispatch(actions.setCard(card))
	}

	const handleHex = (raw) => {
		let inputHex = raw.toUpperCase()
		let parsedHex = inputHex.match(/[0-9a-f]{2}/gi) || ''
		let reversedHex
		if (parsedHex.length > 0) {
			if (settingsState.reverse) {
				reversedHex = parsedHex.slice().reverse()
			} else {
				reversedHex = parsedHex
			}
			let dispHex = parsedHex.reduce((result, x) => {
				result = result + ' ' + x
				return result
			}, '')
			//Reverse HEX and convert to binary with padding.
			let orderedHex = reversedHex.reduce(
				(result, x) => {
					result.hex = result.hex + ' ' + x
					let binary = parseInt(x, 16).toString(2)
					binary = '00000000'.substr(binary.length) + binary
					result.bin = result.bin + binary
					return result
				},
				{ hex: '', bin: '' }
			)
			let cut = orderedHex.bin.length - cardState.bits || 0
			let binaryOut = orderedHex.bin.slice(cut)
			let card = cardState
			card.inputHex = inputHex
			card.dispHex = dispHex
			card.orderedHex = orderedHex.hex
			card.binary = orderedHex.bin
			card.dispBinary = binaryOut
			cardDispatch(actions.setCard(card))
			settingsDispatch(actions.setShowDecode(true))
			handleDecodeBits()
		} else {
			let card = cardState
			card.inputHex = inputHex
			cardDispatch(actions.setCard(card))
			settingsDispatch(actions.setShowDecode(false))
		}
	}

	return (
		<div>
			<div ref={contentRef}>
				<Card title='Card Decoder Tool' className='decoder'>
					<Row>
						<Input
							s={3}
							name='group1'
							type='checkbox'
							value='reverse'
							label='Reverse Raw Hex'
							checked={settingsState.reverse}
							disabled={settingsState.connected}
							onClick={() =>
								settingsDispatch(actions.setReverse(!settingsState.reverse))
							}
						/>
						<Input
							s={3}
							name='group1'
							type='checkbox'
							value='invert'
							label='Invert Bits'
							checked={settingsState.invertBits}
							onClick={() => {
								settingsDispatch(
									actions.setInvertBits(!settingsState.invertBits)
								)
							}}
						/>
						<Input
							s={3}
							onClick={connectButton}
							name='group1'
							type='checkbox'
							value='connected'
							label='Connect USB Reader'
							checked={settingsState.connected}
						/>
						<Input
							s={3}
							name='group1'
							type='checkbox'
							value='settings'
							label='Show Reader Settings'
							checked={settingsState.showSettings}
							onClick={handleShowSettings}
						/>
					</Row>
					<Row>
						{settingsState.connected ? (
							<Fragment>
								<div className='col s5'>
									<label className='active' htmlFor='inputHex'>
										Raw Hex Value
									</label>
									<p id='inputHex'>{cardState.inputHex}</p>
								</div>
								<div className='col s2'>
									<label className='active' htmlFor='inputBits'>
										Card Bits
									</label>
									<p id='inputBits'>{cardState.bits}</p>
								</div>
							</Fragment>
						) : (
							<Fragment>
								<Input
									id='HEX'
									onChange={handleUserInput}
									s={5}
									label='Raw Hex Value'
									value={cardState.inputHex}
								/>
								<Input
									id='BITS'
									onChange={handleUserInput}
									s={2}
									min='0'
									type='number'
									label='Card Bits'
									value={cardState.bits}
								/>
							</Fragment>
						)}
						<Col s={1} />
						{settingsState.showSettings ? (
							<Fragment>
								<div className='col s2'>
									<label className='active'>Facility Code</label>
									<p>{cardState.facilityCode}</p>
								</div>
								<div className='col s2'>
									<label className='active'>Card Number</label>
									<p>{cardState.cardNumber}</p>
								</div>
							</Fragment>
						) : (
							<Fragment>
								<Input
									id='FACILITY'
									onChange={handleUserInput}
									s={2}
									label='Facility Code'
									value={cardState.facilityCode}
								/>
								<Input
									id='CARD'
									onChange={handleUserInput}
									s={2}
									label='Card Number'
									value={cardState.cardNumber}
								/>
							</Fragment>
						)}
					</Row>
					<Row style={settingsState.showDecode ? null : { display: 'none' }}>
						<div className='col s6'>
							<label className='active' htmlFor='parsedHex'>
								Parsed Hex
							</label>
							<p id='parsedHex'>{cardState.dispHex}</p>
						</div>
						<div
							style={settingsState.reverse ? null : { display: 'none' }}
							className='col s6'
						>
							<label className='active' htmlFor='reverseHex'>
								Reversed Hex
							</label>
							<p id='reverseHex'>{cardState.orderedHex}</p>
						</div>
						<div className='col s12 divider' style={{ margin: '5px' }} />
						<div className='col s12'>
							<label htmlFor='bits'>
								{settingsState.invertBits ? 'Inverted Binary' : 'Binary'}
							</label>
							<p className='binary'>
								<Highlight
									fontSize={cardState.fontSize}
									binary={
										settingsState.invertBits
											? cardState.invertedBinary
											: cardState.dispBinary
									}
									card={cardState.cardBits}
									facility={cardState.facilityBits}
								/>
							</p>
						</div>
						<div
							style={
								!settingsState.showSettings
									? { display: 'none' }
									: cardState.decodeLength > cardState.bits
									? { color: 'red', fontWeight: 'bold' }
									: null
							}
							className='col s12 binary'
						>
							{cardState.decodeBinary.map((chunk, index) => (
								<span
									style={
										chunk === cardState.facilityChunk
											? {
													backgroundColor: 'lightgreen',
													fontSize: cardState.fontSize,
											  }
											: chunk === cardState.cardChunk
											? {
													backgroundColor: 'yellow',
													fontSize: cardState.fontSize,
											  }
											: { fontSize: cardState.fontSize }
									}
									key={index}
								>
									{chunk}
								</span>
							))}
						</div>
						<div className='col s12 divider' />
					</Row>
					<Row style={settingsState.showSettings ? null : { display: 'none' }}>
						<div style={{ paddingTop: '15px' }} className='col s1'>
							Facility Code
						</div>
						<div className='col s1'>
							<label className='active'>Start</label>
							<input
								id='SITESTART'
								onChange={handleUserInput}
								value={readerSettingsState.facilityStart}
								min='0'
								type='number'
							/>
						</div>
						<div className='col s1'>
							<label className='active'>Length</label>
							<input
								id='SITELENGTH'
								onChange={handleUserInput}
								value={readerSettingsState.facilityLength}
								min='0'
								type='number'
							/>
						</div>
						<Col s={1} />
						<div style={{ paddingTop: '15px' }} className='col s1'>
							Card Number
						</div>
						<div className='col s1'>
							<label className='active'>Start</label>
							<input
								id='CARDSTART'
								onChange={handleUserInput}
								value={readerSettingsState.cardStart}
								min='0'
								type='number'
							/>
						</div>
						<div className='col s1'>
							<label className='active'>Length</label>
							<input
								id='CARDLENGTH'
								onChange={handleUserInput}
								value={readerSettingsState.cardLength}
								min='0'
								type='number'
							/>
						</div>
						<Col s={2} />
						<div className='col s3'>
							<label className='active'>Common Format</label>
							<select
								name='selectFormat'
								id='FORMAT'
								onChange={handleUserInput}
							>
								{COMMON_CARD_FORMATS.map((i) => (
									<option key={i.format} value={i.format}>
										{i.format}
									</option>
								))}
							</select>
						</div>
						<div className='col s12 divider' />
					</Row>
				</Card>
			</div>
			<Row className='decoder'>
				<Col s={9} />
				<Col s={3}>
					<Button onClick={reactToPrintFn} style={{ float: 'right' }}>
						<i className='material-icons left'>print</i>Print
					</Button>
				</Col>
			</Row>
		</div>
	)
}

export default Reader
