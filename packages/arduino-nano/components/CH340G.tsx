import React from "react";

export const CH340G = (props: { name: string; pcbX?: string | number; pcbY?: string | number; center?: [number, number] }) => (
  <chip
    {...props}
    footprint="soic16"
    pinLabels={{
      pin1: "GND",
      pin2: "TXD",
      pin3: "RXD",
      pin4: "V3",
      pin5: "UD+",
      pin6: "UD-",
      pin7: "XI",
      pin8: "XO",
      pin9: "CTS",
      pin10: "DSR",
      pin11: "RI",
      pin12: "DCD",
      pin13: "DTR",
      pin14: "RTS",
      pin15: "VCC",
      pin16: "VCC",
    }}
  />
);
