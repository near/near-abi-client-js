/// <reference types="node" />
import { Connection } from 'near-api-js';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers';
import { AbiRoot, AbiParameters, AbiFunction } from 'near-abi';
import { Wallet } from '@near-wallet-selector/core';
import BN from 'bn.js';
export interface FunctionCallOptions {
    signer?: string;
    /** max amount of gas that method call can use */
    gas?: BN;
    /** amount of NEAR (in yoctoNEAR) to send together with the call */
    attachedDeposit?: BN;
    /**
     * Callback url to send the NEAR Wallet if using it to sign transactions.
     * @see {@link RequestSignTransactionsOptions}
     */
    walletCallbackUrl?: string;
}
export declare class AbiValidationError extends Error {
    constructor(error: string);
}
declare function serializeArgs(fn_name: string, args: any[], params_abi?: AbiParameters): Buffer;
export declare class ContractMethodInvocation {
    #private;
    get contract(): Contract;
    get arguments(): any[];
    get method(): AbiFunction;
    transact?(wallet: Wallet, opts?: FunctionCallOptions): Promise<void | FinalExecutionOutcome>;
    view?(): Promise<any>;
    /**
     * @param contract NEAR Contract object
     * @param fn ABI function object
     * @param args Arguments to pass to the function
     */
    constructor(contract: Contract, fn: AbiFunction, args: any[]);
}
export declare class ContractMethods {
    readonly [fn: string]: (...args: any[]) => ContractMethodInvocation;
    /**
     * @param contract NEAR Contract object
     */
    constructor(contract: Contract);
}
export declare class Contract {
    #private;
    get connection(): Connection;
    get contractId(): string;
    get abi(): AbiRoot;
    readonly methods: ContractMethods;
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
