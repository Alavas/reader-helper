import React, { Component, Fragment } from 'react'
import { Card, Col, Input, Row } from 'react-materialize'
import Highlight from './components/Highlight'
import serial from './usb'

let USBDevice

class Reader extends Component {
	constructor(props) {
		super(props)
		this.state = {
			inputHex: '',
			dispHex: '',
			orderedHex: '',
			bits: '',
			binary: '',
			dispBinary: '',
			decodeBinary: [],
			decodeLength: 0,
			cardNumber: '',
			cardBits: '',
			cardStart: 0,
			cardLength: 0,
			cardChunk: '',
			facilityChunk: '',
			facilityStart: 0,
			facilityLength: 0,
			facilityCode: '',
			facilityBits: '',
			showDecode: false,
			showSettings: false,
			reverse: true
		} //Sample - 77 9A C7 03
		this.handleUserInput = this.handleUserInput.bind(this)
		this.handleCardNumber = this.handleCardNumber.bind(this)
		this.handleFacilityCode = this.handleFacilityCode.bind(this)
		this.handleHex = this.handleHex.bind(this)
		this.handleBits = this.handleBits.bind(this)
		this.handleDecodeBits = this.handleDecodeBits.bind(this)
		this.handleReverse = this.handleReverse.bind(this)
		this.handleSettings = this.handleSettings.bind(this)
		this.handleShowSettings = this.handleShowSettings.bind(this)
		this.connectButton = this.connectButton.bind(this)
		this.connectUSB = this.connectUSB.bind(this)
	}

	connectButton() {
		if (USBDevice) {
			USBDevice.disconnect()
			USBDevice = null
			this.setState({
				connected: false,
				reverse: true
			})
		} else {
			serial
				.requestPort()
				.then(selectedPort => {
					USBDevice = selectedPort
					this.connectUSB()
					this.setState({
						connected: true,
						reverse: false
					})
				})
				.catch(error => {
					this.setState({
						connected: false
					})
					window.Materialize.toast('No USB device selected.', 5000)
				})
		}
	}

	connectUSB() {
		USBDevice.connect().then(
			() => {
				USBDevice.onReceive = data => {
					let textDecoder = new TextDecoder()
					let cardJSON = textDecoder.decode(data)
					cardJSON = JSON.parse(cardJSON)
					this.setState({
						readerBits: cardJSON.bits,
						readerHex: cardJSON.hex
					})
					this.handleHex(cardJSON.hex)
					this.handleBits(cardJSON.bits)
				}
				USBDevice.onReceiveError = error => {
					window.Materialize.toast(error, 5000)
				}
			},
			error => {
				window.Materialize.toast(error, 5000)
			}
		)
	}

	//Preprocess user inputs to simply logic used elsewhere.
	handleUserInput(e) {
		switch (e.target.id) {
			case 'HEX':
				this.handleHex(e.target.value)
				break
			case 'BITS':
				this.handleBits(e.target.value)
				break
			case 'CARD':
				this.handleCardNumber(e.target.value)
				break
			case 'FACILITY':
				this.handleFacilityCode(e.target.value)
				break
			case 'SITESTART':
				this.handleSettings({ key: 'facilityStart', value: e.target.value })
				break
			case 'SITELENGTH':
				this.handleSettings({
					key: 'facilityLength',
					value: e.target.value
				})
				break
			case 'CARDSTART':
				this.handleSettings({ key: 'cardStart', value: e.target.value })
				break
			case 'CARDLENGTH':
				this.handleSettings({ key: 'cardLength', value: e.target.value })
				break
			default:
				break
		}
	}

	handleSettings(settings) {
		//TODO: logic needed to prevent the site code and card number from overlapping.
		this.setState(
			{
				[settings.key]: parseInt(settings.value, 10)
			},
			() => this.handleDecodeBits()
		)
	}

	handleDecodeBits() {
		//Only process if the settings section is being displayed.
		if (this.state.showSettings) {
			let decodeBinary = '*'.repeat(this.state.bits)
			decodeBinary = decodeBinary.split('')
			let facilityChunk = 'F'.repeat(this.state.facilityLength)
			let cardChunk = 'C'.repeat(this.state.cardLength)
			if (this.state.cardLength > 0)
				decodeBinary.splice(
					this.state.cardStart,
					this.state.cardLength,
					cardChunk
				)
			if (this.state.facilityLength > 0)
				decodeBinary.splice(
					this.state.facilityStart,
					this.state.facilityLength,
					facilityChunk
				)
			let facilityBits = this.state.dispBinary.slice(
				this.state.facilityStart,
				this.state.facilityStart + this.state.facilityLength
			)
			let cardBits = this.state.dispBinary.slice(
				this.state.cardStart,
				this.state.cardStart + this.state.cardLength
			)
			let decodeLength = decodeBinary.join('').length
			let cardNumber = parseInt(cardBits, 2) || 0
			let facilityCode = parseInt(facilityBits, 2) || 0
			this.setState({
				decodeBinary,
				decodeLength,
				cardBits,
				facilityBits,
				cardNumber,
				facilityCode,
				facilityChunk,
				cardChunk
			})
		}
	}

	handleShowSettings() {
		this.setState(
			{
				showSettings: !this.state.showSettings,
				facilityCode: '',
				cardNumber: '',
				facilityStart: 0,
				facilityLength: 0,
				cardStart: 0,
				cardLength: 0
			},
			() => {
				this.handleCardNumber()
				this.handleFacilityCode()
				this.handleDecodeBits()
			}
		)
	}

	handleReverse() {
		this.setState(
			{
				reverse: !this.state.reverse
			},
			() => this.handleHex(this.state.inputHex)
		)
	}

	handleCardNumber(cardNumber) {
		let cardBits = parseInt(cardNumber, 10).toString(2)
		this.setState({
			cardNumber,
			cardBits
		})
	}

	handleFacilityCode(facilityCode) {
		let facilityBits = parseInt(facilityCode, 10).toString(2)
		this.setState({
			facilityCode,
			facilityBits
		})
	}

	handleBits(inputBits) {
		let cut = this.state.binary.length - inputBits
		let dispBinary = this.state.binary.slice(cut)
		this.setState(
			{
				bits: inputBits,
				dispBinary
			},
			() => this.handleDecodeBits()
		)
	}

	handleHex(raw) {
		let inputHex = raw.toUpperCase()
		let parsedHex = inputHex.match(/[0-9a-f]{2}/gi) || ''
		let reversedHex
		if (parsedHex.length > 0) {
			if (this.state.reverse) {
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
			let cut = orderedHex.bin.length - this.state.bits || 0
			let binaryOut = orderedHex.bin.slice(cut)
			this.setState(
				{
					inputHex,
					dispHex,
					orderedHex: orderedHex.hex,
					binary: orderedHex.bin,
					dispBinary: binaryOut,
					showDecode: true
				},
				() => this.handleDecodeBits()
			)
		} else {
			this.setState({
				inputHex,
				showDecode: false
			})
		}
	}

	render() {
		return (
			<div>
				<Card title="Card Decoder Tool" className="decoder">
					<Row>
						<Input
							s={4}
							name="group1"
							type="checkbox"
							value="reverse"
							label="Reverse Raw Hex"
							checked={this.state.reverse}
							disabled={this.state.connected}
							onClick={this.handleReverse}
						/>
						<Input
							s={4}
							onClick={this.connectButton}
							name="group1"
							type="checkbox"
							value="connected"
							label="Connect USB Reader"
							checked={this.state.connected}
						/>
						<Input
							s={4}
							name="group1"
							type="checkbox"
							value="settings"
							label="Show Reader Settings"
							checked={this.state.showSettings}
							onClick={this.handleShowSettings}
						/>
					</Row>
					<Row>
						{this.state.connected ? (
							<Fragment>
								<div className="col s5">
									<label className="active" htmlFor="inputHex">
										Raw Hex Value
									</label>
									<p id="inputHex">{this.state.inputHex}</p>
								</div>
								<div className="col s2">
									<label className="active" htmlFor="inputBits">
										Card Bits
									</label>
									<p id="inputBits">{this.state.bits}</p>
								</div>
							</Fragment>
						) : (
							<Fragment>
								<Input
									id="HEX"
									onChange={this.handleUserInput}
									s={5}
									label="Raw Hex Value"
									value={this.state.inputHex}
								/>
								<Input
									id="BITS"
									onChange={this.handleUserInput}
									s={2}
									label="Card Bits"
									value={this.state.bits}
								/>
							</Fragment>
						)}
						<Col s={1} />
						{this.state.showSettings ? (
							<Fragment>
								<div className="col s2">
									<label className="active">Facility Code</label>
									<p>{this.state.facilityCode}</p>
								</div>
								<div className="col s2">
									<label className="active">Card Number</label>
									<p>{this.state.cardNumber}</p>
								</div>
							</Fragment>
						) : (
							<Fragment>
								<Input
									id="FACILITY"
									onChange={this.handleUserInput}
									s={2}
									label="Facility Code"
									value={this.state.facilityCode}
								/>
								<Input
									id="CARD"
									onChange={this.handleUserInput}
									s={2}
									label="Card Number"
									value={this.state.cardNumber}
								/>
							</Fragment>
						)}
					</Row>
					<Row style={this.state.showDecode ? null : { display: 'none' }}>
						<div className="col s6">
							<label className="active" htmlFor="parsedHex">
								Parsed Hex
							</label>
							<p id="parsedHex">{this.state.dispHex}</p>
						</div>
						<div
							style={this.state.reverse ? null : { display: 'none' }}
							className="col s6"
						>
							<label className="active" htmlFor="reverseHex">
								Reversed Hex
							</label>
							<p id="reverseHex">{this.state.orderedHex}</p>
						</div>
						<div className="col s12 divider" style={{ margin: '5px' }} />
						<div className="col s12">
							<label htmlFor="bits">Binary</label>
							<p className="binary">
								<Highlight
									binary={this.state.dispBinary}
									card={this.state.cardBits}
									facility={this.state.facilityBits}
								/>
							</p>
						</div>
						<div
							style={
								!this.state.showSettings
									? { display: 'none' }
									: this.state.decodeLength > this.state.bits
									? { color: 'red', fontWeight: 'bold' }
									: null
							}
							className="col s12 binary"
						>
							{this.state.decodeBinary.map((chunk, index) => (
								<span
									style={
										chunk === this.state.facilityChunk
											? { backgroundColor: 'lightgreen' }
											: chunk === this.state.cardChunk
											? { backgroundColor: 'yellow' }
											: null
									}
									key={index}
								>
									{chunk}
								</span>
							))}
						</div>
						<div className="col s12 divider" />
					</Row>
					<Row
						style={this.state.showSettings ? null : { display: 'none' }}
					>
						<Col s={1} />
						<div style={{ paddingTop: '15px' }} className="col s1">
							Facility Code
						</div>
						<div className="col s2">
							<label className="active">Start Bit</label>
							<input
								id="SITESTART"
								onChange={this.handleUserInput}
								value={this.state.facilityStart}
								min="0"
								type="number"
							/>
						</div>
						<div className="col s2">
							<label className="active">Number of Bits</label>
							<input
								id="SITELENGTH"
								onChange={this.handleUserInput}
								value={this.state.facilityLength}
								min="0"
								type="number"
							/>
						</div>

						<div style={{ paddingTop: '15px' }} className="col s1">
							Card Number
						</div>
						<div className="col s2">
							<label className="active">Start Bit</label>
							<input
								id="CARDSTART"
								onChange={this.handleUserInput}
								value={this.state.cardStart}
								min="0"
								type="number"
							/>
						</div>
						<div className="col s2">
							<label className="active">Number of Bits</label>
							<input
								id="CARDLENGTH"
								onChange={this.handleUserInput}
								value={this.state.cardLength}
								min="0"
								type="number"
							/>
						</div>
						<div className="col s12 divider" />
					</Row>
				</Card>
			</div>
		)
	}
}

export default Reader
