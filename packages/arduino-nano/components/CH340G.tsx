import React from "react";

export const CH340G = (props: { name: string; pcbX?: string | number; pcbY?: string | number }) => (
  <chip
    {...props}
    footprint="soic16"
    pinLabels={{
      pin1: "GND",
      pin2: "TXD",
      pin3: "RXD",
      pin4: "V3",
      pin13: "DTR",
      pin16: "VCC",
    }}
  />
);
