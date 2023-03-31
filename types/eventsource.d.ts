declare module 'eventsource' {
    declare class EventSource {
        static readonly CLOSED: number;
        static readonly CONNECTING: number;
        static readonly OPEN: number;
      
        constructor(url: string, eventSourceInitDict?: EventSource.EventSourceInitDict);
      
        readonly CLOSED: number;
        readonly CONNECTING: number;
        readonly OPEN: number;
        readonly url: string;
        readonly readyState: number;
        readonly withCredentials: boolean;
        onopen: (evt: MessageEvent) => any;
        onmessage: (evt: MessageEvent) => any;
        onerror: (evt: MessageEvent) => any;
        addEventListener(type: string, listener: (evt: MessageEvent) => void): void;
        dispatchEvent(evt: Event): boolean;
        removeEventListener(type: string, listener: (evt: MessageEvent) => void): void;
        close(): void;
        responseTimeout: number;
        onreconnect: (evt: MessageEvent) => any;
      }
      
      declare namespace EventSource {
        enum ReadyState { CONNECTING = 0, OPEN = 1, CLOSED = 2 }
      
        interface EventSourceInitDict {
          withCredentials?: boolean | undefined;
          headers?: object | undefined;
          proxy?: string | undefined;
          https?: object | undefined;
          rejectUnauthorized?: boolean | undefined;
        }
      }

}
