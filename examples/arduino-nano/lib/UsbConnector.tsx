export const UsbConnector = () => (
  <group name="usb" pcbPack>
    <chip
      name="J1"
      footprint="usb_mini_b"
      schX={8}
      schY={0}
      pcbX="14mm"
      pcbY="0mm"
      pinLabels={{
        pin1: "VBUS",
        pin2: "D-",
        pin3: "D+",
        pin4: "ID",
        pin5: "GND",
      }}
      connections={{
        VBUS: "U3.VIN",
        "D+": "net.USB_P",
        "D-": "net.USB_N",
        GND: "net.GND",
      }}
    />
  </group>
)
