export class CameraService {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement;
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D | null;
  private isCapturing = false;

  constructor() {
    this.video = document.createElement('video');
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.muted = true;

    // We will extract frames at 640x480 to save bandwidth
    this.canvas = new OffscreenCanvas(640, 480);
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  public async requestPermissions(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: false,
      });
      this.video.srcObject = this.stream;
      await this.video.play();
      return true;
    } catch (err: any) {
      console.error('Camera permission denied or unavailable', err);
      return false;
    }
  }

  public stop() {
    this.isCapturing = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  public startFrameExtraction(onFrame: (blob: Blob) => void, fps: number = 30) {
    if (!this.ctx || !this.stream) return;
    this.isCapturing = true;

    const intervalMs = 1000 / fps;
    let lastExtractTime = 0;

    const extractLoop = async (time: number) => {
      if (!this.isCapturing) return;

      if (time - lastExtractTime >= intervalMs) {
        lastExtractTime = time;
        this.ctx!.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        // Compress as JPEG to save websocket bandwidth
        const blob = await this.canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
        onFrame(blob);
      }

      requestAnimationFrame(extractLoop);
    };

    requestAnimationFrame(extractLoop);
  }

  public getVideoElement(): HTMLVideoElement {
    return this.video;
  }
}
