// Parametric QFN32 3D model definition
export interface QFN32Dimensions {
  width: number;
  length: number;
  thickness: number;
  pitch: number;
}

export const QFN32_DEFAULT: QFN32Dimensions = {
  width: 5.0,
  length: 5.0,
  thickness: 0.8,
  pitch: 0.5,
};

export const createQFN32Model = (dims: QFN32Dimensions = QFN32_DEFAULT) => {
  return {
    type: "cuboid",
    size: [dims.width, dims.length, dims.thickness],
    pinCount: 32,
    pitch: dims.pitch,
  };
};
