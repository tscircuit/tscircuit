export const footprintLibraryMap = {
  "community:arduinoshield": {
    footprint: `
      module arduinoshield
      units mm

      # Arduino shield outline
      layer copper_top
      rect 0 0 68.58 53.34

      # Arduino header positions (simplified)
      # Digital pins header
      pin d0 14.0 2.54
      pin d1 16.51 2.54
      pin d2 19.02 2.54
      pin d3 21.53 2.54
      pin d4 24.04 2.54
      pin d5 26.55 2.54
      pin d6 29.06 2.54
      pin d7 31.57 2.54
      pin d8 36.68 2.54
      pin d9 39.19 2.54
      pin d10 41.7 2.54
      pin d11 44.21 2.54
      pin d12 46.72 2.54
      pin d13 49.23 2.54

      # Analog pins header
      pin a0 54.61 2.54
      pin a1 57.12 2.54
      pin a2 59.63 2.54
      pin a3 62.14 2.54
      pin a4 64.65 2.54
      pin a5 67.16 2.54

      # Power pins
      pin 5v 2.54 48.26
      pin 3.3v 7.62 48.26
      pin gnd1 12.7 48.26
      pin gnd2 15.21 48.26
      pin vin 17.72 48.26
      pin a_ref 20.23 48.26
      pin reset 22.74 48.26
      pin io_ref 25.25 48.26

      # ICSP header
      pin icsp_miso 41.91 48.26
      pin icsp_5v 44.42 48.26
      pin icsp_sck 46.93 48.26
      pin icsp_mosi 49.44 48.26
      pin icsp_rst 51.95 48.26
      pin icsp_gnd 54.46 48.26
    `,
    width: 68.58,
    height: 53.34,
  },

  "community:raspberrypihat": {
    footprint: `
      module raspberrypihat
      units mm

      # Raspberry Pi HAT outline
      layer copper_top
      rect 0 0 65 56.5

      # GPIO header (40-pin)
      # Pins are arranged in a 2x20 grid
      # Left side (even pins)
      pin gpio2 3.5 2.0
      pin gpio3 3.5 4.5
      pin gpio4 3.5 7.0
      pin gpio5 3.5 9.5
      pin gpio6 3.5 12.0
      pin gpio7 3.5 14.5
      pin gpio8 3.5 17.0
      pin gpio9 3.5 19.5
      pin gpio10 3.5 22.0
      pin gpio11 3.5 24.5
      pin gpio12 3.5 27.0
      pin gpio13 3.5 29.5
      pin gpio14 3.5 32.0
      pin gpio15 3.5 34.5
      pin gpio16 3.5 37.0
      pin gpio17 3.5 39.5
      pin gpio18 3.5 42.0
      pin gpio19 3.5 44.5
      pin gpio20 3.5 47.0
      pin gpio21 3.5 49.5

      # Right side (odd pins)
      pin gpio22 61.5 2.0
      pin gpio23 61.5 4.5
      pin gpio24 61.5 7.0
      pin gpio25 61.5 9.5
      pin gpio26 61.5 12.0
      pin gpio27 61.5 14.5
      pin gpio28 61.5 17.0
      pin gpio29 61.5 19.5
      pin gpio30 61.5 22.0
      pin gpio31 61.5 24.5
      pin gpio32 61.5 27.0
      pin gpio33 61.5 29.5
      pin gpio34 61.5 32.0
      pin gpio35 61.5 34.5
      pin gpio36 61.5 37.0
      pin gpio37 61.5 39.5
      pin gpio38 61.5 42.0
      pin gpio39 61.5 44.5
      pin gpio40 61.5 47.0
      pin gpio41 61.5 49.5

      # Power and ground pins
      pin 3v3_1 3.5 52.0
      pin 5v_1 61.5 52.0
      pin gnd_1 3.5 54.5
      pin gnd_2 61.5 54.5

      # EEPROM I2C pins
      pin eeprom_id_sd 8.0 54.5
      pin eeprom_id_sc 10.5 54.5
    `,
    width: 65,
    height: 56.5,
  },

  "community:sparkfunmicromod_processor": {
    footprint: `
      module sparkfunmicromod_processor
      units mm

      # MicroMod Processor outline (22mm x 22mm)
      layer copper_top
      rect 0 0 22 22

      # MicroMod edge connector pins (76 pins total)
      # This is a simplified representation - actual MicroMod has many pins
      # Processor board connects to carrier board via edge connector

      # Key pins for reference
      pin usb_d_n 2.0 2.0
      pin usb_d_p 4.0 2.0
      pin gnd 6.0 2.0
      pin 3v3 8.0 2.0
      pin reset 10.0 2.0
      pin boot 12.0 2.0
      pin gpio0 14.0 2.0
      pin gpio1 16.0 2.0
      pin gpio2 18.0 2.0
      pin gpio3 20.0 2.0

      # Additional pins around the perimeter
      pin gpio4 20.0 4.0
      pin gpio5 20.0 6.0
      pin gpio6 20.0 8.0
      pin gpio7 20.0 10.0
      pin gpio8 20.0 12.0
      pin gpio9 20.0 14.0
      pin gpio10 20.0 16.0
      pin gpio11 20.0 18.0

      pin gpio12 18.0 20.0
      pin gpio13 16.0 20.0
      pin gpio14 14.0 20.0
      pin gpio15 12.0 20.0
      pin gpio16 10.0 20.0
      pin gpio17 8.0 20.0
      pin gpio18 6.0 20.0
      pin gpio19 4.0 20.0

      pin gpio20 2.0 4.0
      pin gpio21 2.0 6.0
      pin gpio22 2.0 8.0
      pin gpio23 2.0 10.0
      pin gpio24 2.0 12.0
      pin gpio25 2.0 14.0
      pin gpio26 2.0 16.0
      pin gpio27 2.0 18.0
    `,
    width: 22,
    height: 22,
  },

  "community:sparkfunmicromod_host": {
    footprint: `
      module sparkfunmicromod_host
      units mm

      # MicroMod Carrier board outline (approximate 75mm x 75mm)
      layer copper_top
      rect 0 0 75 75

      # MicroMod connector position (centered)
      # The connector is positioned to accept processor boards
      # Processor board socket at center
      pin proc_conn_1 26.5 26.5
      pin proc_conn_2 28.5 26.5
      pin proc_conn_3 30.5 26.5
      pin proc_conn_4 32.5 26.5
      pin proc_conn_5 34.5 26.5
      pin proc_conn_6 36.5 26.5
      pin proc_conn_7 38.5 26.5
      pin proc_conn_8 40.5 26.5
      pin proc_conn_9 42.5 26.5
      pin proc_conn_10 44.5 26.5
      pin proc_conn_11 46.5 26.5
      pin proc_conn_12 48.5 26.5

      # Additional connector pins around the processor socket
      pin proc_conn_13 48.5 28.5
      pin proc_conn_14 48.5 30.5
      pin proc_conn_15 48.5 32.5
      pin proc_conn_16 48.5 34.5
      pin proc_conn_17 48.5 36.5
      pin proc_conn_18 48.5 38.5
      pin proc_conn_19 48.5 40.5
      pin proc_conn_20 48.5 42.5
      pin proc_conn_21 48.5 44.5
      pin proc_conn_22 48.5 46.5

      # USB connector position (typically on one side)
      pin usb_vcc 5.0 65.0
      pin usb_d_n 7.5 65.0
      pin usb_d_p 10.0 65.0
      pin usb_gnd 12.5 65.0

      # Power regulation pins
      pin vin 60.0 65.0
      pin vcc_3v3 62.5 65.0
      pin vcc_5v 65.0 65.0
      pin gnd_main 67.5 65.0

      # Additional GPIO breakout pins (around the perimeter)
      pin gpio_breakout_1 5.0 5.0
      pin gpio_breakout_2 10.0 5.0
      pin gpio_breakout_3 15.0 5.0
      pin gpio_breakout_4 20.0 5.0
      pin gpio_breakout_5 70.0 5.0
      pin gpio_breakout_6 70.0 10.0
      pin gpio_breakout_7 70.0 15.0
      pin gpio_breakout_8 70.0 20.0
      pin gpio_breakout_9 70.0 70.0
      pin gpio_breakout_10 65.0 70.0
      pin gpio_breakout_11 60.0 70.0
      pin gpio_breakout_12 55.0 70.0
      pin gpio_breakout_13 5.0 70.0
      pin gpio_breakout_14 10.0 70.0
      pin gpio_breakout_15 15.0 70.0
      pin gpio_breakout_16 20.0 70.0
    `,
    width: 75,
    height: 75,
  },
} as const

export type BoardTemplateKey = keyof typeof footprintLibraryMap
