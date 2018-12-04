import React, { Component, Fragment } from 'react'
import { Row, Col, Input, CardPanel } from 'react-materialize'
import Highlighter from 'react-highlight-words'
import serial from './usb'

let USBDevice

class Reader extends Component {
	constructor(props) {
		super(props)
		this.state = {
			inputHex: '03C79A77',
			dispHex: '',
			orderedHex: '',
			binary: '',
			dispBinary: '',
			bits: '',
			cardNumber: '',
			cardBits: '',
			decodeBinary: '',
			siteStart: 0,
			siteLength: 0,
			cardStart: 0,
			cardLength: 0,
			showDecode: false,
			showSettings: false,
			reverse: true
		}
		this.handleUserInput = this.handleUserInput.bind(this)
		this.handleCardNumber = this.handleCardNumber.bind(this)
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
			let arr = decodeBinary.split('')
			let site = 'S'.repeat(this.state.siteLength)
			let card = 'C'.repeat(this.state.cardLength)
			if (this.state.cardLength > 0)
				arr.splice(this.state.cardStart, this.state.cardLength, card)
			if (this.state.siteLength > 0)
				arr.splice(this.state.siteStart, this.state.siteLength, site)
			decodeBinary = arr.join('')
			let cardBits = this.state.dispBinary.slice(
				this.state.cardStart,
				this.state.cardStart + this.state.cardLength
			)
			let cardNumber = parseInt(cardBits, 2) || 0
			this.setState({ decodeBinary, cardBits, cardNumber })
		}
	}

	handleShowSettings() {
		this.setState(
			{
				showSettings: !this.state.showSettings,
				cardNumber: ''
			},
			() => this.handleCardNumber()
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
			case 'SITESTART':
				this.handleSettings({ key: 'siteStart', value: e.target.value })
				break
			case 'SITELENGTH':
				this.handleSettings({ key: 'siteLength', value: e.target.value })
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

	handleReverse() {
		this.setState(
			{
				reverse: !this.state.reverse
			},
			() => this.handleHex(this.state.inputHex)
		)
	}

	handleCardNumber(cardNumber) {
		let binary = parseInt(cardNumber, 10).toString(2)
		this.setState({
			cardNumber: cardNumber,
			cardBits: binary
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
					inputHex: inputHex,
					dispHex: dispHex,
					orderedHex: orderedHex.hex,
					binary: orderedHex.bin,
					dispBinary: binaryOut,
					showDecode: true
				},
				() => this.handleDecodeBits()
			)
		} else {
			this.setState({
				inputHex: inputHex,
				showDecode: false
			})
		}
	}

	render() {
		return (
			<div>
				<CardPanel
					style={{
						width: '60%',
						minWidth: '700px',
						marginLeft: 'auto',
						marginRight: 'auto',
						marginTop: '50px'
					}}
				>
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
								<div className="col s6">
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
									s={6}
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
						{this.state.showSettings ? (
							<Fragment>
								<div className="col s4">
									<label className="active">Card Number</label>
									<p>{this.state.cardNumber}</p>
								</div>
							</Fragment>
						) : (
							<Fragment>
								<Input
									id="CARD"
									onChange={this.handleUserInput}
									s={4}
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
							<p>
								<Highlighter
									className="binary"
									searchWords={[this.state.cardBits]}
									autoEscape={true}
									textToHighlight={this.state.dispBinary}
									unhighlightStyle={{ color: 'black' }}
								/>
							</p>
						</div>
						<div
							style={
								!this.state.showSettings
									? { display: 'none' }
									: this.state.decodeBinary.length > this.state.bits
									? { color: 'red', fontWeight: 'bold' }
									: { color: 'green' }
							}
							className="col s12 binary"
						>
							{this.state.decodeBinary}
						</div>
						<div className="col s12 divider" />
					</Row>
					<Row
						style={this.state.showSettings ? null : { display: 'none' }}
					>
						<div style={{ paddingTop: '15px' }} className="col s1">
							Site Code
						</div>
						<div className="col s2">
							<label className="active">Start Bit</label>
							<input
								id="SITESTART"
								onChange={this.handleUserInput}
								value={this.state.siteStart}
								min="0"
								type="number"
							/>
						</div>
						<div className="col s2">
							<label className="active">Number of Bits</label>
							<input
								id="SITELENGTH"
								onChange={this.handleUserInput}
								value={this.state.siteLength}
								min="0"
								type="number"
							/>
						</div>
						<Col s={2} />
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
				</CardPanel>
			</div>
		)
	}
}

export default Reader
