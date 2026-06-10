import React from "react";

export const ATmega328P = (props: { name: string; pcbX?: string | number; pcbY?: string | number }) => (
  <chip
    {...props}
    footprint="tqfp32"
    pinLabels={{
      pin3: "GND",
      pin4: "VCC",
      pin5: "GND",
      pin6: "VCC",
      pin18: "AVCC",
      pin21: "GND",
      pin29: "RESET",
      pin30: "PD0", // RXD
      pin31: "PD1", // TXD
      // Additional pins for full implementation...
    }}
  />
);
