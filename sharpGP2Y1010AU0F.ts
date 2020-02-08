/**
 * Sharp GP2Y1010AU0F Dust Sensor extension for calliope.
 * WAVESHARE module edition. 
 * https://www.waveshare.com/dust-sensor.htm
 * 
 * @author Raik Andritschke
 *
 * Optional using nRF51 Internal voltage reference instead of VDD
 */
//% weight=10 color=#2E2E2E icon="\uf0c2"
//% block="sharpGP2Y1010AU0F"
namespace sharpGP2Y1010AU0F {
    export enum ReferenceVoltage {
	//% block=Internal Reference Voltage
	REFERENCE_VOLTAGE_INT = 1200, // mV; internal REF nRF51x
	//% block=External Reference Voltage
	REFERENCE_VOLTAGE_EXT = 3000 // mV; external REF nRF51x, USB or battery
    }
    const NODUST_VOLTAGE = 600; // mV
    const CONVERSION_RATIO = 20; // μg/m3 / mV, SPEC; in percent
    const WAVESHARE_DIVIDER = 11;
    const PULSE_TIME = 320; // μs, SPEC
    const SAMPLING_TIME = 280; // μs, SPEC
    const PINREAD_TIME = 80; // μs, for calliope 
    const CYCLE_TIME = 10000; // μs, SPEC recommended
    const VLED_ON = 1;
    const VLED_OFF = 0;
    let SAMPLES = 10; // SPEC recommended
    let VLED = 0; // digital out PIN
    let VO = 0; // analog in PIN
    let REFERENCE_VOLTAGE = ReferenceVoltage.REFERENCE_VOLTAGE_INT;
    //% blockId="initDustSensor" block="initialize dustsensor with DigitalPin %vled | AnalogPin %vo| and Samples %samples"
    //% vled.defl=DigitalPin.P0
    //% vo.defl=AnalogPin.P2
    //% samples.defl=10    
    //% reference.defl=REFERENCE_VOLTAGE_EXT
    export function initDustSensor(vled: DigitalPin, vo: AnalogPin, samples: number) {
        VLED = vled;
        VO = vo;
        SAMPLES = samples;
    }

    //% blockId="getSensorRAWValue" block="get RAW value in mV from dustsensor"
    export function getSensorRAWValue(): number {
        let analogvalue = 0.0;
	let voltage = 0.0;
        let sum_voltage = 0.0;
        if ((VLED == 0) || (VO == 0) || (SAMPLES == 0)) {
            return 0
        }
        let delta_time = PULSE_TIME - SAMPLING_TIME - PINREAD_TIME;
        if (delta_time < 0) {
            delta_time = 0;
        }
        let sleep_time = CYCLE_TIME - Math.max(PULSE_TIME, SAMPLING_TIME + PINREAD_TIME)
        for (let i = 0; i < SAMPLES; i++) {
            // LED on
            pins.digitalWritePin(VLED, VLED_ON);
            control.waitMicros(SAMPLING_TIME);
            if (REFERENCE_VOLTAGE = ReferenceVoltage.REFERENCE_VOLTAGE_INT) { 
		analogvalue = pins.analogReadPinInternalRef(VO);
	    } else {
	        analogvalue = pins.analogReadPin(VO);
            }
	    if (delta_time > 0) {
                control.waitMicros(delta_time);
            }
            pins.digitalWritePin(VLED, VLED_OFF);
            control.waitMicros(sleep_time);
            voltage = REFERENCE_VOLTAGE / 1023 * analogvalue;
            sum_voltage += voltage;
        }
        voltage = sum_voltage / SAMPLES; // mV
        return voltage * WAVESHARE_DIVIDER;
    }

    //% blockId="getDustValue" block="get dust value in μg/m³ from dustsensor."
    export function getDustValue(): number {
        let dust = 0.0;
        dust = (getSensorRAWValue() - NODUST_VOLTAGE) * CONVERSION_RATIO / 100;
        if (dust < 0) {
            dust = 0
        }
        return dust;
    }
}
