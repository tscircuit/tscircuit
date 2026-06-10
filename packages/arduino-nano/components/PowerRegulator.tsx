import React from "react";

export const PowerRegulator = (props: { name: string; pcbX?: string | number; pcbY?: string | number }) => (
  <group {...props}>
    <chip
      name="reg5v"
      footprint="sot223"
      manufacturerPartNumber="AMS1117-5.0"
      pinLabels={{ pin1: "GND", pin2: "V5", pin3: "VIN" }}
    />
    {/* Simple proxy for group interface */}
    <port name="GND" pinNumber={1} />
    <port name="V5" pinNumber={2} />
    <port name="VIN" pinNumber={3} />
  </group>
);
