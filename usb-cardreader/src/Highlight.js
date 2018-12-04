import React, { Fragment } from 'react'

const Highlight = props => {
	const rawCardBits = props.binary
	const cardNumBits = props.card
	const facilityNumBits = props.facility
	let searchBits = rawCardBits.split('')
	let cardStart = rawCardBits.lastIndexOf(cardNumBits)
	let facilityStart = rawCardBits.lastIndexOf(facilityNumBits)
	if (cardStart >= 0) {
		searchBits.splice(cardStart, cardNumBits.length, cardNumBits)
	}
	if (facilityStart >= 0) {
		searchBits.splice(facilityStart, facilityNumBits.length, facilityNumBits)
	}
	return (
		<Fragment>
			{searchBits.map((chunk, index) => {
				return (
					<span
						style={
							chunk === facilityNumBits
								? { backgroundColor: 'lightgreen' }
								: chunk === cardNumBits
								? { backgroundColor: 'yellow' }
								: null
						}
						key={index}
					>
						{chunk}
					</span>
				)
			})}
		</Fragment>
	)
}

export default Highlight
