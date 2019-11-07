# Emotion Detector

Teaching a machine to feel :heart:

## How it works

This UI depends on a trained [tensorflowjs](https://www.tensorflow.org/js) model that outputs 7 logits. `["Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise", "Neutral"]` are the emotions we assume this network can feel.

## Quickstart

We've setup a Colab notebook that trains a model and renders this UI. You can find it [here](https://colab.research.google.com/drive/1dK7ztFkhd0Vz32utoKfOHITBAjOAKBgx).

## Development

You can modify this UI and run it locally with a converted model by running:

```js
git clone https://github.com/vanpelt/emotion-detector
cd emotion-detector
npm install
npm run start
```
