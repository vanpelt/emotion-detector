import React, { Component } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import * as tf from "@tensorflow/tfjs";
import { extractFaceAndCrop } from "./util.js";
import "./App.css";

class App extends Component {
  state = { loading: true, avg: [] };
  upload = React.createRef();
  webcam = React.createRef();
  preview = React.createRef();
  labels = ["Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise", "Neutral"];

  /**
   * Load the face detector and smile models
   */
  async componentDidMount() {
    const base = window.BASE_URL || process.env.PUBLIC_URL;
    this.tinyFace = await faceapi.loadTinyFaceDetectorModel(base + "models");
    this.smileDetector = await tf.loadLayersModel(base + "models/model.json");
    const tensor = await extractFaceAndCrop(this.getInput());
    this.smileDetector.predict(tensor);
    this.setState({ loading: false });
  }

  /**
   * Preview the input given to the model
   */
  previewInput(input) {
    const ctx = this.preview.current.getContext("2d");
    const result = ctx.createImageData(48, 48);
    for (var i = 0; i < input.length; i += 1) {
      result.data[i * 4] = input[i] * 255;
      result.data[i * 4 + 1] = input[i] * 255;
      result.data[i * 4 + 2] = input[i] * 255;
      result.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(result, 0, 0);
  }

  /**
   * Use the loaded model to make a prediction
   */
  async predict(input) {
    const detection = await faceapi.detectSingleFace(
      input,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 256 })
    );
    if (detection) {
      const tensor = await extractFaceAndCrop(input, detection);
      this.previewInput(tensor.dataSync());
      this.setState({ loading: true });
      const start = window.performance.now();
      const results = this.smileDetector.predict(tensor).dataSync();
      const time = window.performance.now() - start;
      this.setState({
        loading: false,
        inferenceTime: time,
        avg: this.state.avg.concat(time),
        results
      });
    } else {
      console.warn("No face found, skipping dection");
    }
  }

  /**
   * Run inference every 200ms
   */
  toggleAutoDetect() {
    if (!this.state.autoDetect) {
      this.setState({
        autoDetect: setInterval(() => {
          this.predict(this.getInput());
        }, 200)
      });
    } else {
      clearInterval(this.state.autoDetect);
      this.setState({ autoDetect: false });
    }
  }

  /*async uploadImage() {
    this.upload.current.files[0];
    await faceapi.bufferToImage(imgFile);
  }*/

  getInput() {
    let input = this.webcam.current.getCanvas();
    if (!input) {
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      canvas.getContext("2d").fillRect(0, 0, 100, 100);
      input = canvas;
    }
    //TODO: handle no webcam
    return input;
  }

  render() {
    const videoConstraints = {
      facingMode: "user"
    };
    let results = [];
    if (this.state.inferenceTime) {
      let best = 0;
      let bestIdx = 0;
      this.state.results.forEach((r, i) => {
        if (r > best) {
          best = r;
          bestIdx = i;
        }
      });
      this.state.results.forEach((r, i) =>
        results.push(
          <li key={i} className={i === bestIdx ? "best" : ""}>
            {this.labels[i]}: {Math.round(r * 10000) / 100}%
          </li>
        )
      );
    }
    return (
      <div className="App">
        <header
          className={"App-header" + (this.state.loading ? " App-loading" : "")}
        >
          <Webcam videoConstraints={videoConstraints} ref={this.webcam} />
          <div className="App-controls">
            <button
              className="App-detect"
              onClick={() => this.predict(this.getInput())}
            >
              Predict Once
            </button>
            <button
              className="App-detect"
              onClick={() => this.toggleAutoDetect()}
            >
              {this.state.autoDetect ? "Stop " : "Start "}Streaming
            </button>
            <div className="App-stats">
              {this.state.inferenceTime && (
                <ul>
                  <li>
                    <strong>Average time:</strong>{" "}
                    {Math.round(
                      (this.state.avg.reduce((r, el) => r + el, 0) /
                        this.state.avg.length) *
                        100
                    ) / 100}
                    ms
                  </li>
                  <li>
                    <strong>Last inference time:</strong>{" "}
                    {Math.round(this.state.inferenceTime * 100) / 100}ms
                  </li>
                  <li>
                    <strong>Results:</strong>
                    <ul>{results}</ul>
                  </li>
                </ul>
              )}
            </div>
            <canvas ref={this.preview} width="48" height="48" />
          </div>
        </header>
      </div>
    );
  }
}

export default App;
