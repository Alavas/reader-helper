/*
 * USB Connected Wiegand Card reader
 * Outputs a JSON file via serial to webpage in the format { "state": "CONNECTED", "bits": 26, "hex": "03C79A77"}
 */

//https://github.com/webusb/arduino
#include <WebUSB.h>
//https://github.com/Alavas/YetAnotherArduinoWiegandLibrary
#include <Wiegand.h>

// These are the pins connected to the Wiegand D0 and D1 signals.
#define PIN_D0 2
#define PIN_D1 3

// The object that handles the wiegand protocol
Wiegand wiegand;
WebUSB WebUSBSerial(1 /* https:// */, "your-endpoint");

//Override existing serial library with WebUSB serial library.
#define Serial WebUSBSerial

// Initialize Wiegand reader
void setup()
{
    Serial.begin(9600);

    //Install listeners and initialize Wiegand reader
    wiegand.onReceive(receivedData, "Card read.");
    wiegand.onStateChange(stateChanged, "State changed.");
    wiegand.begin(Wiegand::LENGTH_ANY, true);

    //initialize pins as INPUT and attaches interruptions
    pinMode(PIN_D0, INPUT);
    pinMode(PIN_D1, INPUT);
    attachInterrupt(digitalPinToInterrupt(PIN_D0), pinStateChanged, CHANGE);
    attachInterrupt(digitalPinToInterrupt(PIN_D1), pinStateChanged, CHANGE);

    //Sends the initial pin state to the Wiegand library
    pinStateChanged();
}

// Every few milliseconds, check for pending messages on the wiegand reader
// This executes with interruptions disabled, since the Wiegand library is not thread-safe
void loop()
{
    noInterrupts();
    wiegand.flush();
    interrupts();
    //Sleep a little -- this doesn't have to run very often.
    delay(100);
}

// When any of the pins have changed, update the state of the wiegand library
void pinStateChanged()
{
    wiegand.setPin0State(digitalRead(PIN_D0));
    wiegand.setPin1State(digitalRead(PIN_D1));
}

// Notifies when a reader has been connected or disconnected.
void stateChanged(bool plugged, const char *message)
{
    Serial.print("{\"state\": \"");
    Serial.print(plugged ? "CONNECTED" : "DISCONNECTED");
    Serial.print("\",\"bits\": \"\", \"hex\": \"\"}");
    Serial.flush();
}

// Notifies when a card was read.
void receivedData(uint8_t *data, uint8_t bits, const char *message)
{
    Serial.print("{\"state\": \"CONNECTED\"");
    Serial.print(",\"bits\": ");
    Serial.print(bits);
    Serial.print(", \"hex\": \"");
    //Print value in HEX
    uint8_t bytes = (bits + 7) / 8;
    for (int i = 0; i < bytes; i++)
    {
        Serial.print(data[i] >> 4, 16);
        Serial.print(data[i] & 0xF, 16);
    }
    Serial.print("\"}");
    Serial.flush();
}
