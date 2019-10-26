import * as faceapi from "face-api.js";
import * as tf from "@tensorflow/tfjs";

/*
const cropImage = img => {
  const size = Math.min(img.shape[0], img.shape[1]);
  const centerHeight = img.shape[0] / 2;
  const beginHeight = centerHeight - size / 2;
  const centerWidth = img.shape[1] / 2;
  const beginWidth = centerWidth - size / 2;
  return img.slice([beginHeight, beginWidth, 0], [size, size, 3]);
};*/

/**
 * Extract a face from an image given raw input and a
 * detection.  Resize to a square given widthHeight.
 * Convert to a tensor and normalize.
 */
export const extractFaceAndCrop = async (
  input,
  detection,
  widthHeight = 48
) => {
  let face = input;
  if (detection) {
    face = (await faceapi.extractFaces(input, [detection]))[0];
  }
  const canvas = document.createElement("canvas");
  canvas.width = widthHeight;
  canvas.height = widthHeight;
  canvas.getContext("2d").drawImage(face, 0, 0, widthHeight, widthHeight);
  const colorTensor = tf.browser.fromPixels(canvas);
  const grayscaleTensor = colorTensor.mean(2).expandDims(2);
  //TODO: deal with aspect ratio and cropping
  //const croppedTensor = cropImage(grayscaleTensor);
  //TODO: don't normalize and show the class
  return grayscaleTensor
    .expandDims(0)
    .toFloat()
    .div(tf.scalar(255));
};
