import {
  SmartSpectraSDK,
  PixelFormat,
  FrameTransform,
  breathingMetrics,
  cardioMetrics,
  faceMetrics,
  micromotionMetrics,
  edaMetrics,
  decodeMetrics,
} from '@smartspectra/node-sdk';

export class SmartSpectraService {
  private sdk: any; // SmartSpectraSDK type
  public onMetricsCb: ((metrics: any, timestamp: number) => void) | null = null;
  public onValidationCb: ((code: any, timestamp: number, hint: string) => void) | null = null;
  public onErrorCb: ((code: any, message: string, retryable: boolean) => void) | null = null;
  public onProcessingStatusCb: ((status: any) => void) | null = null;

  constructor(apiKey: string) {
    this.sdk = new SmartSpectraSDK({
      apiKey,
      requestedMetrics: [
        ...cardioMetrics,
        ...faceMetrics,
        ...breathingMetrics,
      ],
    });

    this.sdk.on('processingStatus', (status: any) => {
      if (this.onProcessingStatusCb) this.onProcessingStatusCb(status);
    });

    this.sdk.on('validationStatus', (code: any, ts: number, hint: string) => {
      if (this.onValidationCb) this.onValidationCb(code, ts, hint);
    });

    this.sdk.on('metrics', (buf: Buffer, ts: number) => {
      try {
        const decoded = decodeMetrics(buf);
        if (this.onMetricsCb) this.onMetricsCb(decoded, ts);
      } catch (err) {
        console.error('Error decoding metrics:', err);
      }
    });

    this.sdk.on('error', (code: any, message: string, retryable: boolean) => {
      console.error(`SmartSpectra SDK Error [${code}]: ${message} (retryable: ${retryable})`);
      if (this.onErrorCb) this.onErrorCb(code, message, retryable);
    });

    this.sdk.useCustomInput(FrameTransform.kNone);
  }

  public async start() {
    await this.sdk.start();
  }

  public async stop() {
    await this.sdk.stop();
  }

  public async destroy() {
    await this.sdk.destroy();
  }

  public sendFrame(rgbBuf: Buffer, width: number, height: number, captureTsUs: number) {
    this.sdk.sendFrame(rgbBuf, width, height, width * 3, PixelFormat.kRGB, captureTsUs);
  }
}
