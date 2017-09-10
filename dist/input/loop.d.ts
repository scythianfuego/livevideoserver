/// <reference types="node" />
import { IInput } from "../interfaces/IInput";
import { EventEmitter } from "events";
export declare class LoopInput extends EventEmitter implements IInput {
    constructor();
    run(): void;
}
