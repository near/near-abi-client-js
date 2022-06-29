import BN from 'bn.js';
import { Account, Connection } from 'near-api-js';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers';
import { CodeResult, getTransactionLastResult } from 'near-api-js/lib/providers/provider';
import { ArgumentTypeError } from 'near-api-js/lib/utils/errors';
import { ABI } from './abi';

export interface FunctionCallOptions {
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

function deserializeJSON(response: Uint8Array): any {
    return JSON.parse(Buffer.from(response).toString());
}

function serializeJSON(input: any): Buffer {
    return Buffer.from(JSON.stringify(input));
}

// Helper function so that
function ignoreSerialization(input: Buffer): Buffer {
    return input;
}

/**
 * Validation on arguments being a big number from bn.js
 * Throws if an argument is not in BN format or otherwise invalid
 * @param argMap
 */
function validateBNLike(argMap: { [name: string]: any }) {
    const bnLike = 'number, decimal string or BN';
    for (const argName of Object.keys(argMap)) {
        const argValue = argMap[argName];
        if (argValue && !BN.isBN(argValue) && isNaN(argValue)) {
            throw new ArgumentTypeError(argName, bnLike, argValue);
        }
    }
}

async function callInternal(
    account: Account,
    contractId: string,
    methodName: string,
    args: Buffer,
    opts?: FunctionCallOptions
): Promise<FinalExecutionOutcome> {
    validateBNLike({ opts: opts?.gas, amount: opts?.attachedDeposit });

    const rawResult = await account.functionCall({
        contractId,
        methodName,
        args,
        gas: opts?.gas,
        attachedDeposit: opts?.attachedDeposit,
        walletMeta: opts?.walletMeta,
        walletCallbackUrl: opts?.walletCallbackUrl,
        // Ignore because we have already serialized args
        stringify: ignoreSerialization,
    });

    return getTransactionLastResult(rawResult);
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

    if (result.logs) {
        if (!process.env['NEAR_NO_LOGS']) {
            for (const log of result.logs) {
                console.log(`Log [${contractId}]: ${log}`);
            }
        }
    }

    return (
        result.result && result.result.length > 0 && Buffer.from(result.result)
    );
}

export interface CallableFunction {
    // TODO naming, maybe call?
    // TODO Account and returning NAJ type, prob not ideal
    callFrom?(
        account: Account,
        opts?: FunctionCallOptions
    ): Promise<FinalExecutionOutcome>;
    view(): Promise<any>;
}

export class Contract {
    readonly connection: Connection;
    readonly contractId: string;
    readonly abi?: ABI;

    /**
     * @param connection Connection to NEAR network through RPC.
     * @param contractId NEAR account id where the contract is deployed.
     * @param abi ABI schema which will be used to generate methods to be called on this Contract
     */
    // TODO not ideal to include NAJ type in constructor
    constructor(connection: Connection, contractId: string, abi?: ABI) {
        this.connection = connection;
        this.contractId = contractId;
        this.abi = abi;

        // TODO this abi is optional, but are the only methods on Contract right now.
        // TODO Maybe worth making it useful outside of just ABI calls or making it mandatory?
        this.abi?.abi.functions.forEach((fn) => {
            const funcName = fn.name;
            const isView = fn.is_view;
            // Create method on this contract object to be able to call methods.
            Object.defineProperty(this, funcName, {
                writable: false,
                enumerable: true,
                // TODO args could be better here, would be ideal to have positional args maybe?
                // TODO at least validate the number of args
                value: (...args: any[]) => {
                    const { connection, contractId } = this;
                    const func: CallableFunction = {
                        // Include a call function if the function is not view only.
                        callFrom: isView
                            ? undefined
                            : async function (
                                account,
                                opts
                            ): Promise<FinalExecutionOutcome> {
                                // TODO should serialize based on protocol
                                const paramBytes = args
                                    ? serializeJSON(args)
                                    : Buffer.alloc(0);
                                // Using inner NAJ APIs for result for consistency, but this might
                                // not be ideal API.
                                return callInternal(
                                    account,
                                    contractId,
                                    funcName,
                                    paramBytes,
                                    opts
                                );
                            },
                        view: async function (): Promise<any> {
                            // TODO this should serialize based on protocol from schema
                            const paramBytes = args
                                ? serializeJSON(args)
                                : Buffer.alloc(0);
                            const returnBytes = await viewInternal(
                                connection,
                                contractId,
                                funcName,
                                paramBytes
                            );
                            // TODO deserialize based on protocol from schema
                            return deserializeJSON(returnBytes);
                        },
                    };
                    return func;
                },
            });
        });
    }
}
