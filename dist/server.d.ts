/// <reference types="node" />
export declare class Server {
    private streamUrl;
    private lastdata;
    private decoder;
    constructor();
    startRTMP(): void;
    startSocketServer(): void;
    parseStream(data: Buffer): void;
}
