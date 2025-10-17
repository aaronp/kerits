/**
 * MERITS Client Library
 *
 * Simple streaming client for connecting to MERITS server.
 */

// Types
export interface Message {
  to: string;
  from: string;
  payload: string | Uint8Array;
  type?: string;
}

export interface HandshakeRequest {
  type: 'handshake';
  clientAid: string;
  supportedProtocols: string[];
  heartbeatInterval?: number;
}

export interface HandshakeResponse {
  type: 'handshake-response';
  meritsAid: string;
  meritsAgentAid?: string;
  protocol: string;
  heartbeatInterval: number;
}

export interface ErrorMessage {
  type: 'error';
  reason: string;
  code?: string;
}

export interface ControlMessage {
  type: 'control';
  command: string;
  params?: any;
}

export interface ProtocolCodec {
  encode(message: Message | HandshakeRequest | HandshakeResponse | ErrorMessage | ControlMessage): Uint8Array;
  decode(data: Uint8Array): Message | HandshakeRequest | HandshakeResponse | ErrorMessage | ControlMessage;
}

import { EnvelopeV1Codec, OpaqueCodec } from './protocol/protocol-codec';

/**
 * Client configuration
 */
export interface ClientConfig {
  url: string;
  aid: string;
  supportedProtocols?: string[];
  heartbeatInterval?: number;
  onMessage?: (message: Message) => void;
  onControl?: (control: ControlMessage) => void;
  onError?: (error: ErrorMessage) => void;
  onConnected?: (response: HandshakeResponse) => void;
  onDisconnected?: () => void;
}

/**
 * Client connection state
 */
export enum ClientState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  HANDSHAKING = 'handshaking',
  CONNECTED = 'connected',
  CLOSING = 'closing',
}

/**
 * MERITS Client
 */
export class MeritsClient {
  private ws?: WebSocket;
  private codec: ProtocolCodec = new EnvelopeV1Codec();
  private state: ClientState = ClientState.DISCONNECTED;
  private heartbeatTimer?: Timer;

  constructor(public config: ClientConfig) {}

  /**
   * Connect to MERITS server
   */
  async connect(): Promise<HandshakeResponse> {
    if (this.state !== ClientState.DISCONNECTED) {
      throw new Error(`Cannot connect: state is ${this.state}`);
    }

    return new Promise((resolve, reject) => {
      this.state = ClientState.CONNECTING;

      // Create WebSocket connection
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => {
        this.state = ClientState.HANDSHAKING;

        // Send handshake
        const handshake: HandshakeRequest = {
          type: 'handshake',
          supportedProtocols: this.config.supportedProtocols || ['envelope-v1'],
          clientAid: this.config.aid,
          heartbeatInterval: this.config.heartbeatInterval,
        };

        // Send as JSON string
        this.ws!.send(JSON.stringify(handshake));
      };

      this.ws.onmessage = event => {
        // Parse JSON message
        const decoded = typeof event.data === 'string'
          ? JSON.parse(event.data)
          : event.data;

        // Restore Uint8Array payloads from base64 (browser-compatible)
        if ('payload' in decoded && typeof decoded.payload === 'string') {
          const binaryString = atob(decoded.payload);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          decoded.payload = bytes;
        }

        // Handle handshake response
        if (this.state === ClientState.HANDSHAKING && decoded.type === 'handshake') {
          const response = decoded as HandshakeResponse;

          // Update codec based on negotiated protocol
          if (response.selectedProtocol === 'opaque') {
            this.codec = new OpaqueCodec();
          } else {
            this.codec = new EnvelopeV1Codec();
          }

          this.state = ClientState.CONNECTED;

          // Start heartbeat if configured
          if (response.heartbeatInterval) {
            this.startHeartbeat(response.heartbeatInterval);
          }

          this.config.onConnected?.(response);
          resolve(response);
          return;
        }

        // Handle error messages
        if (decoded.type === 'error') {
          const error = decoded as ErrorMessage;
          this.config.onError?.(error);
          return;
        }

        // Handle control messages
        if (decoded.type === 'control') {
          const controlMsg = decoded as ControlMessage;
          this.config.onControl?.(controlMsg);
          return;
        }

        // Handle regular messages
        if ('to' in decoded && 'from' in decoded && 'payload' in decoded) {
          const message = decoded as Message;
          this.config.onMessage?.(message);
          return;
        }
      };

      this.ws.onerror = error => {
        reject(new Error('WebSocket error'));
      };

      this.ws.onclose = () => {
        this.state = ClientState.DISCONNECTED;
        this.stopHeartbeat();
        this.config.onDisconnected?.();
      };
    });
  }

  /**
   * Send message
   */
  send(to: string, payload: Uint8Array, options?: { type?: string; id?: string }): void {
    if (this.state !== ClientState.CONNECTED) {
      throw new Error(`Cannot send: state is ${this.state}`);
    }

    // Convert Uint8Array to base64 (browser-compatible)
    const base64 = btoa(String.fromCharCode(...payload));

    const message: any = {
      to,
      from: this.config.aid,
      payload: base64,
    };

    if (options?.type) {
      message.type = options.type;
    }

    if (options?.id) {
      message.id = options.id;
    }

    this.ws!.send(JSON.stringify(message));
  }

  /**
   * Send control message
   */
  sendControl(
    command: ControlMessage['command'],
    params?: ControlMessage['params']
  ): void {
    if (this.state !== ClientState.CONNECTED) {
      throw new Error(`Cannot send control: state is ${this.state}`);
    }

    const control: ControlMessage = {
      type: 'control',
      command,
      params,
    };

    this.ws!.send(JSON.stringify(control));
  }

  /**
   * Discover online AIDs
   * Returns a promise that resolves with the list of discoverable AIDs
   */
  async discover(): Promise<string[]> {
    if (this.state !== ClientState.CONNECTED) {
      throw new Error(`Cannot discover: state is ${this.state}`);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Discovery timeout')), 5000);

      // Check WebSocket exists
      if (!this.ws) {
        clearTimeout(timeout);
        reject(new Error('WebSocket not connected'));
        return;
      }

      // Set up one-time listener for discovery response
      const originalOnMessage = this.ws.onmessage;

      this.ws.onmessage = (event) => {
        const decoded = typeof event.data === 'string'
          ? JSON.parse(event.data)
          : event.data;

        if (decoded.type === 'discovery') {
          clearTimeout(timeout);
          if (this.ws) {
            this.ws.onmessage = originalOnMessage; // Restore original handler
          }
          resolve(decoded.aids);
        } else {
          // Forward to original handler
          if (originalOnMessage && this.ws) {
            originalOnMessage.call(this.ws, event);
          }
        }
      };

      // Send discover control message
      this.sendControl('discover');
    });
  }

  /**
   * Set discoverable flag
   */
  setDiscoverable(discoverable: boolean): void {
    this.sendControl('setDiscoverable', { discoverable });
  }

  /**
   * Set allow list (mutually exclusive with deny list)
   */
  setAllowList(aids: string[]): void {
    this.sendControl('setAllowList', { aids });
  }

  /**
   * Set deny list (mutually exclusive with allow list)
   */
  setDenyList(aids: string[]): void {
    this.sendControl('setDenyList', { aids });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.ws) {
      this.state = ClientState.CLOSING;
      this.stopHeartbeat();
      this.ws.close();
      this.ws = undefined;
    }
    this.state = ClientState.DISCONNECTED;
  }

  /**
   * Get current state
   */
  getState(): ClientState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === ClientState.CONNECTED;
  }

  /**
   * Start heartbeat timer
   */
  private startHeartbeat(intervalMs: number): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.state === ClientState.CONNECTED && this.ws) {
        // Send ping (empty control message)
        try {
          this.sendControl('ping');
        } catch {
          // Ignore errors
        }
      }
    }, intervalMs);
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }
}

/**
 * Create client instance
 */
export function createClient(config: ClientConfig): MeritsClient {
  return new MeritsClient(config);
}
