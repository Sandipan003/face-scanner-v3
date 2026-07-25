export class CameraService {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement;
  private canvas: OffscreenCanvas | null = null;
  private ctx: OffscreenCanvasRenderingContext2D | null = null;
  private isCapturing = false;

  constructor() {
    this.video = document.createElement('video');
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.muted = true;
  }

  public async requestPermissions(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: false,
      });
      this.video.srcObject = this.stream;
      await this.video.play();
      
      // Initialize canvas with actual video dimensions
      const w = this.video.videoWidth || 640;
      const h = this.video.videoHeight || 480;
      
      // Calculate a scaled down size if the video is too large (e.g. 1080p) to save bandwidth, while maintaining aspect ratio
      const maxDim = 640;
      let scale = 1;
      if (Math.max(w, h) > maxDim) {
        scale = maxDim / Math.max(w, h);
      }
      const targetW = Math.round(w * scale);
      const targetH = Math.round(h * scale);
      
      this.canvas = new OffscreenCanvas(targetW, targetH);
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
      
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
    if (!this.ctx || !this.stream || !this.canvas) return;
    this.isCapturing = true;

    const intervalMs = 1000 / fps;
    let lastExtractTime = 0;

    const extractLoop = (time: number) => {
      if (!this.isCapturing) return;

      if (time - lastExtractTime >= intervalMs) {
        lastExtractTime = time;
        this.ctx!.drawImage(this.video, 0, 0, this.canvas!.width, this.canvas!.height);
        
        // Compress as JPEG non-blocking to prevent frame drops
        this.canvas!.convertToBlob({ type: 'image/jpeg', quality: 0.6 }).then((blob) => {
          onFrame(blob);
        }).catch(err => console.error("Compression error:", err));
      }

      requestAnimationFrame(extractLoop);
    };

    requestAnimationFrame(extractLoop);
  }

  public getVideoElement(): HTMLVideoElement {
    return this.video;
  }
}
