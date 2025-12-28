import React, { Component, createRef } from "react";
import "./CameraCapture.css";

type CameraCaptureProps = {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
};

type CameraCaptureState = {
  hasCamera: boolean;
  capturedImage: string | null;
  error: string | null;
};

class CameraCapture extends Component<CameraCaptureProps, CameraCaptureState> {
  private videoRef = createRef<HTMLVideoElement>();
  private canvasRef = createRef<HTMLCanvasElement>();
  private stream: MediaStream | null = null;

  constructor(props: CameraCaptureProps) {
    super(props);
    this.state = {
      hasCamera: false,
      capturedImage: null,
      error: null,
    };
  }

  componentDidMount() {
    this.startCamera();
  }

  componentWillUnmount() {
    this.stopCamera();
  }

  startCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.setState({
          hasCamera: false,
          error: "Camera not supported in this browser. Try Chrome or Firefox.",
        });
        return;
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true, // Simplified - let browser pick the best camera
        audio: false,
      });
      if (this.videoRef.current) {
        this.videoRef.current.srcObject = this.stream;
        this.setState({ hasCamera: true, error: null });
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Camera error:", error);
      let errorMsg = "Could not access camera. ";
      if (error.name === "NotAllowedError") {
        errorMsg += "Please allow camera permissions in your browser.";
      } else if (error.name === "NotFoundError") {
        errorMsg += "No camera found on this device.";
      } else if (error.name === "NotReadableError") {
        errorMsg += "Camera is in use by another application.";
      } else {
        errorMsg += error.message || "Unknown error.";
      }
      this.setState({
        hasCamera: false,
        error: errorMsg,
      });
    }
  };

  stopCamera = () => {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  };

  capturePhoto = () => {
    const video = this.videoRef.current;
    const canvas = this.canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size for output (400x400 for better quality)
    const size = 400;
    canvas.width = size;
    canvas.height = size;

    // Calculate square crop from center of video
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const cropSize = Math.min(videoWidth, videoHeight);
    const cropX = (videoWidth - cropSize) / 2;
    const cropY = (videoHeight - cropSize) / 2;

    // Draw cropped and scaled image
    ctx.drawImage(video, cropX, cropY, cropSize, cropSize, 0, 0, size, size);

    // Convert to high quality JPEG
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    this.setState({ capturedImage: imageDataUrl });
    this.stopCamera();
  };

  retakePhoto = () => {
    this.setState({ capturedImage: null });
    this.startCamera();
  };

  usePhoto = () => {
    if (this.state.capturedImage) {
      this.props.onCapture(this.state.capturedImage);
    }
  };

  render() {
    const { capturedImage, error, hasCamera } = this.state;

    return (
      <div className="camera-capture-overlay">
        <div className="camera-capture-modal">
          <h3>Take a Photo</h3>

          {error && <p className="camera-error">{error}</p>}

          {!capturedImage ? (
            <>
              <div className="camera-preview-container">
                <video
                  ref={this.videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-preview"
                />
                <div className="camera-crop-guide" />
              </div>
              <div className="camera-buttons">
                <button onClick={this.props.onCancel} className="camera-btn cancel">
                  Cancel
                </button>
                <button
                  onClick={this.capturePhoto}
                  disabled={!hasCamera}
                  className="camera-btn capture"
                >
                  Capture
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="camera-preview-container">
                <img src={capturedImage} alt="Captured" className="captured-image" />
              </div>
              <div className="camera-buttons">
                <button onClick={this.retakePhoto} className="camera-btn cancel">
                  Retake
                </button>
                <button onClick={this.usePhoto} className="camera-btn capture">
                  Use Photo
                </button>
              </div>
            </>
          )}

          <canvas ref={this.canvasRef} style={{ display: "none" }} />
        </div>
      </div>
    );
  }
}

export default CameraCapture;
