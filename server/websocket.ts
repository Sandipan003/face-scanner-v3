import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import jpeg from 'jpeg-js';
import { SmartSpectraService } from './services/SmartSpectraService';

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/api/scan/stream' });
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback_secret";

  wss.on('connection', async (ws: WebSocket, req: any) => {
    try {
      // Authenticate via query param or headers (for simplicity, we expect token in query)
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        ws.close(4001, 'Unauthorized');
        return;
      }

      jwt.verify(token, secret);

      const apiKey = process.env.SMARTSPECTRA_API_KEY;
      if (!apiKey) {
        ws.close(5000, 'Server misconfiguration: No API key');
        return;
      }

      const sdkService = new SmartSpectraService(apiKey);

      sdkService.onMetricsCb = (metrics, ts) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'metrics', timestamp: ts, data: metrics }));
        }
      };

      sdkService.onValidationCb = (code, ts, hint) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'validation', code, timestamp: ts, hint }));
        }
      };
      
      sdkService.onProcessingStatusCb = (status) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'status', status }));
        }
      };

      sdkService.onErrorCb = (code, message, retryable) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'error', code, message, retryable }));
        }
      };

      await sdkService.start();

      ws.on('message', (message: Buffer) => {
        try {
          // Decode JPEG to raw RGBA
          const rawImageData = jpeg.decode(message, { useTArray: true });
          
          // SmartSpectra SDK requires RGB format (without Alpha channel)
          const width = rawImageData.width;
          const height = rawImageData.height;
          const rgba = rawImageData.data;
          
          const rgbBuf = Buffer.allocUnsafe(width * height * 3);
          let j = 0;
          for (let i = 0; i < rgba.length; i += 4) {
            rgbBuf[j++] = rgba[i];     // R
            rgbBuf[j++] = rgba[i+1];   // G
            rgbBuf[j++] = rgba[i+2];   // B
          }
          
          const captureTsUs = Number(process.hrtime.bigint() / 1000n);
          sdkService.sendFrame(rgbBuf, width, height, captureTsUs);
        } catch (err) {
          console.error("Failed to decode frame", err);
        }
      });

      ws.on('close', async () => {
        try {
          await sdkService.stop();
          await sdkService.destroy();
        } catch (e) {
          console.error("Error stopping SDK", e);
        }
      });

    } catch (err) {
      console.error("WS connection error:", err);
      ws.close(4003, 'Connection error');
    }
  });

  return wss;
}
