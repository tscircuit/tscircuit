import React from "react";

export const ATmega328P = (props: { name: string; pcbX?: string | number; pcbY?: string | number; center?: [number, number] }) => (
  <chip
    {...props}
    footprint="tqfp32"
    pinLabels={{
      pin1: "PD3",
      pin2: "PD4",
      pin3: "GND",
      pin4: "VCC",
      pin5: "GND",
      pin6: "VCC",
      pin7: "PB6",
      pin8: "PB7",
      pin9: "PD5",
      pin10: "PD6",
      pin11: "PD7",
      pin12: "PB0",
      pin13: "PB1",
      pin14: "PB2",
      pin15: "PB3",
      pin16: "PB4",
      pin17: "PB5",
      pin18: "AVCC",
      pin19: "ADC6",
      pin20: "AREF",
      pin21: "GND",
      pin22: "ADC7",
      pin23: "PC0",
      pin24: "PC1",
      pin25: "PC2",
      pin26: "PC3",
      pin27: "PC4",
      pin28: "PC5",
      pin29: "PC6",
      pin30: "PD0",
      pin31: "PD1",
      pin32: "PD2",
    }}
  />
);
