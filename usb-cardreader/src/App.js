import React, { Component } from 'react'
import { Row, Input, CardPanel } from 'react-materialize'
import Highlighter from 'react-highlight-words'
import serial from './usb'

let USBDevice

class Reader extends Component {
	constructor(props) {
		super(props)
		this.state = {
			hexInput: '',
			dispHex: '',
			orderedHex: '',
			binary: '',
			dispBinary: '',
			bits: '',
			cardNumber: '',
			cardBits: '',
			display: false,
			showSettings: false,
			reverse: true
		}
		this.handleUserInput = this.handleUserInput.bind(this)
		this.handleCardNumber = this.handleCardNumber.bind(this)
		this.handleHex = this.handleHex.bind(this)
		this.handleBits = this.handleBits.bind(this)
		this.handleReverse = this.handleReverse.bind(this)
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

	handleShowSettings() {
		this.setState({
			showSettings: !this.state.showSettings
		})
	}

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
			default:
				break
		}
	}

	handleReverse() {
		this.setState({
			reverse: !this.state.reverse
		})
		this.handleHex(this.state.hexInput)
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
		let binaryOut = this.state.binary.slice(cut)
		this.setState({
			bits: inputBits,
			dispBinary: binaryOut
		})
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
			this.setState({
				hexInput: inputHex,
				dispHex: dispHex,
				orderedHex: orderedHex.hex,
				binary: orderedHex.bin,
				dispBinary: binaryOut,
				display: true
			})
		} else {
			this.setState({
				hexInput: inputHex,
				display: false
			})
		}
	}

	render() {
		return (
			<div>
				<CardPanel
					style={{
						width: '50%',
						minWidth: '500px',
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
							<React.Fragment>
								<div className="col s6">
									<label className="active" htmlFor="inputHex">
										Raw Hex Value
									</label>
									<p id="inputHex">{this.state.hexInput}</p>
								</div>
								<div className="col s2">
									<label className="active" htmlFor="inputBits">
										Card Bits
									</label>
									<p id="inputBits">{this.state.bits}</p>
								</div>
							</React.Fragment>
						) : (
							<React.Fragment>
								<Input
									id="HEX"
									onChange={this.handleUserInput}
									s={6}
									label="Raw Hex Value"
									value={this.state.hexInput}
								/>
								<Input
									id="BITS"
									onChange={this.handleUserInput}
									s={2}
									label="Card Bits"
									value={this.state.bits}
								/>
							</React.Fragment>
						)}
						<Input
							id="CARD"
							onChange={this.handleUserInput}
							s={4}
							label="Card Number"
							value={this.state.cardNumber}
						/>
					</Row>
					<Row style={this.state.display ? null : { display: 'none' }}>
						<div className="col s6">
							<label className="active" htmlFor="parsedHex">
								Parsed Hex
							</label>
							<p id="parsedHex">{this.state.dispHex}</p>
						</div>
						<div className="col s6">
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
									searchWords={[this.state.cardBits]}
									autoEscape={true}
									textToHighlight={this.state.dispBinary}
									unhighlightStyle={{ color: 'red' }}
								/>
							</p>
						</div>
						<div className="col s12 divider" />
					</Row>
					<Row style={this.state.showSettings ? null : { display: 'none' }}>
						Reader Settings Placeholder
						<div className="col s12 divider" />
					</Row>
				</CardPanel>
			</div>
		)
	}
}

export default Reader
