# USB Card Reader / Decoder Tool

This repository contains an Arduino sketch as well as a React SPA to allow for an Arduino with a connected Wiegand RFID reader to a webpage. This allows the user to test cards to determine what the formatting is. When connected the Arduino will send the number of bits as well as the raw Hex value from the card. The webpage will then convert this to a binary string.
