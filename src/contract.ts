import { Connection } from 'near-api-js';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers';
import { CodeResult } from 'near-api-js/lib/providers/provider';
import { AbiRoot, AbiParameter, AbiFunction } from './abi';
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

async function transactInternal(
    account: Wallet,
    contractId: string,
    methodName: string,
    args: Uint8Array,
    opts?: FunctionCallOptions
): Promise<void | FinalExecutionOutcome> {
    return await account.signAndSendTransaction({
        signerId: opts?.signer,
        receiverId: contractId,
        callbackUrl: opts?.walletCallbackUrl,
        actions: [
            {
                type: 'FunctionCall',
                params: {
                    methodName,
                    args,
                    gas: opts?.gas.toString(),
                    deposit: opts?.attachedDeposit.toString(),
                },
            },
        ],
    });
}

async function viewInternal(
    connection: Connection,
    contractId: string,
    functionName: string,
    args: Buffer
): Promise<Buffer> {
    //* Not ideal that this logic is copied, but NAJ requires an Account to
    //* perform a view call, which isn't necessary.
    const serializedArgs = args.toString('base64');

    const result = await connection.provider.query<CodeResult>({
        request_type: 'call_function',
        account_id: contractId,
        method_name: functionName,
        args_base64: serializedArgs,
        finality: 'optimistic',
    });

    if (result.logs && !process.env['NEAR_NO_LOGS']) {
        for (const log of result.logs) {
            console.log(`Log [${contractId}]: ${log}`);
        }
    }

    return (
        result.result && result.result.length > 0 && Buffer.from(result.result)
    );
}

export class AbiValidationError extends Error {
    constructor(error: string) {
        super(`ABI validation error: ${error}`);
    }
}

function deserializeJSON(response: Uint8Array): any {
    return JSON.parse(Buffer.from(response).toString());
}

function serializeJSON(input: any): Buffer {
    return Buffer.from(JSON.stringify(input));
}

function serializeArgs(
    fn_name: string,
    args: any[],
    params_abi?: AbiParameter[]
): Buffer {
    if (args.length > 0) {
        if (!params_abi) {
            throw new AbiValidationError(
                `${fn_name} accepts no arguments, got ${args}`
            );
        }

        let param_object: object;
        if (args.length === params_abi.length) {
            // Serializes the arguments as a JSON object by default.
            // The reason for this is that contracts by default support object deserialization
            // and only Rust contracts support the array JSON format ambiguously.
            param_object = args.reduce((accumulator, value, idx) => {
                const key = params_abi[idx].name;
                return { ...accumulator, [key]: value };
            }, {});
        } else if (
            args.length === 1 &&
            typeof args[0] === 'object' &&
            args[0] !== null
        ) {
            // Parameter for function call is an object, validate keys are correct
            // and serialize.
            param_object = args[0];
            const keys = Object.keys(param_object);
            if (keys.length !== params_abi.length) {
                throw new AbiValidationError(
                    `Invalid number of fields for ${fn_name}, expected ${params_abi.length} got ${keys.length}`
                );
            }

            //* This doesn't validate the order of keys. If we wanted serialization to be
            //* canonical, we would check it here or sort after this method.
            for (const k of params_abi) {
                if (!param_object[k.name]) {
                    throw new AbiValidationError(
                        `Function ${fn_name} expected key ${k.name} in parameter object`
                    );
                }
            }
        } else {
            throw new AbiValidationError(
                `Invalid number of parameters for ${fn_name}, expected ${params_abi.length} got ${args.length}`
            );
        }

        // TODO serialize based on protocol in abi
        return serializeJSON(param_object);
    } else {
        if (params_abi) {
            throw new AbiValidationError(
                `Passed no parameters for ${fn_name}, expected ${params_abi.length}`
            );
        }
        return Buffer.alloc(0);
    }
}

export class ContractMethodInvocation {
    #contract: Contract;
    public get contract(): Contract {
        return this.#contract;
    }
    #arguments: any[];
    public get arguments(): any[] {
        return this.#arguments;
    }
    #method: AbiFunction;
    public get method(): AbiFunction {
        return this.#method;
    }

    transact?(
        wallet: Wallet,
        opts?: FunctionCallOptions
    ): Promise<void | FinalExecutionOutcome>;

    view?(): Promise<any>;

    /**
     * @param contract NEAR Contract object
     * @param fn ABI function object
     * @param args Arguments to pass to the function
     */
    constructor(contract: Contract, fn: AbiFunction, args: any[]) {
        [this.#method, this.#arguments, this.#contract] = [fn, args, contract];
        if (fn.is_view) {
            this.view = async (): Promise<any> => {
                const returnBytes = await viewInternal(
                    contract.connection,
                    contract.contractId,
                    fn.name,
                    serializeArgs(fn.name, args, fn.params)
                );
                // TODO deserialize based on protocol from schema
                return deserializeJSON(returnBytes);
            };
            Object.defineProperty(this.view, 'name', {
                writable: false,
                value: `ContractMethod[${fn.name}].view`,
            });
        } else {
            this.transact = async (
                account,
                opts
            ): Promise<void | FinalExecutionOutcome> => {
                // Using inner NAJ APIs for result for consistency, but this might
                // not be ideal API.
                return transactInternal(
                    account,
                    contract.contractId,
                    fn.name,
                    serializeArgs(fn.name, args, fn.params),
                    opts
                );
            };
            Object.defineProperty(this.transact, 'name', {
                writable: false,
                value: `ContractMethod[${fn.name}].transact`,
            });
        }
    }
}

export class ContractMethods {
    readonly [fn: string]: (...args: any[]) => ContractMethodInvocation;

    /**
     * @param contract NEAR Contract object
     */
    constructor(contract: Contract) {
        if (!contract.abi)
            throw new Error("Can't create ContractMethods without ABI");
        // Create method on this contract object to be able to call methods.
        for (const fn of contract.abi.body.functions) {
            const handler = (...args): ContractMethodInvocation => {
                return new ContractMethodInvocation(contract, fn, args);
            };
            Object.defineProperty(handler, 'name', {
                writable: false,
                value: `ContractMethod[${fn.name}]`,
            });
            Object.defineProperty(this, fn.name, {
                writable: false,
                enumerable: true,
                value: handler,
            });
        }
    }
}

export class Contract {
    #connection: Connection;
    public get connection(): Connection {
        return this.#connection;
    }

    #contractId: string;
    public get contractId(): string {
        return this.#contractId;
    }

    #abi: AbiRoot;
    public get abi(): AbiRoot {
        return this.#abi;
    }

    readonly methods: ContractMethods;

    /**
     * @param connection Connection to NEAR network through RPC.
     * @param contractId NEAR account id where the contract is deployed.
     * @param abi ABI schema which will be used to generate methods to be called on this Contract
     */
    constructor(connection: Connection, contractId: string, abi: AbiRoot) {
        this.#connection = connection;
        this.#contractId = contractId;
        this.#abi = abi;

        Object.defineProperty(this, 'methods', {
            writable: false,
            enumerable: true,
            value: new ContractMethods(this),
        });
    }
}

export const testingExports = {
    serializeArgs,
};
