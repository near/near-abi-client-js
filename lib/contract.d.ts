/// <reference types="node" />
import { Connection } from 'near-api-js';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers';
import { AbiRoot, AbiParameter } from './abi';
import { Wallet } from '@near-wallet-selector/core';
import BN from 'bn.js';
export interface FunctionCallOptions {
    signer?: string;
    /** max amount of gas that method call can use */
    gas?: BN;
    /** amount of NEAR (in yoctoNEAR) to send together with the call */
    attachedDeposit?: BN;
    /**
     * Metadata to send the NEAR Wallet if using it to sign transactions.
     * @see {@link RequestSignTransactionsOptions}
     */
    walletMeta?: string;
    /**
     * Callback url to send the NEAR Wallet if using it to sign transactions.
     * @see {@link RequestSignTransactionsOptions}
     */
    walletCallbackUrl?: string;
}
export declare class AbiValidationError extends Error {
    constructor(error: string);
}
export interface CallableFunction {
    callFrom?(wallet: Wallet, opts?: FunctionCallOptions): Promise<void | FinalExecutionOutcome>;
    view(): Promise<any>;
}
/**
 * Convenience type for a contract that does not use an ABI.
 */
export interface AnyContract extends Contract {
    [x: string]: any;
}
declare function serializeArgs(fn_name: string, args: any[], params_abi?: AbiParameter[]): Buffer;
export declare class Contract {
    private _connection;
    get connection(): Connection;
    private _contractId;
    get contractId(): string;
    private _abi;
    get abi(): AbiRoot;
    /**
     * @param connection Connection to NEAR network through RPC.
     * @param contractId NEAR account id where the contract is deployed.
     * @param abi ABI schema which will be used to generate methods to be called on this Contract
     */
    constructor(connection: Connection, contractId: string, abi: AbiRoot);
}
export declare const testingExports: {
    serializeArgs: typeof serializeArgs;
};
export {};
