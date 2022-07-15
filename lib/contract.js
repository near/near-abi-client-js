"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testingExports = exports.Contract = exports.AbiValidationError = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const provider_1 = require("near-api-js/lib/providers/provider");
const errors_1 = require("near-api-js/lib/utils/errors");
function deserializeJSON(response) {
    return JSON.parse(Buffer.from(response).toString());
}
function serializeJSON(input) {
    return Buffer.from(JSON.stringify(input));
}
// Helper function so that internally `near-api-js` doesn't re-serialize the input.
function ignoreSerialization(input) {
    return input;
}
/**
 * Validation on arguments being a big number from bn.js
 * Throws if an argument is not in BN format or otherwise invalid
 * @param argMap
 */
function validateBNLike(argMap) {
    const bnLike = 'number, decimal string or BN';
    for (const argName of Object.keys(argMap)) {
        const argValue = argMap[argName];
        if (argValue && !bn_js_1.default.isBN(argValue) && isNaN(argValue)) {
            throw new errors_1.ArgumentTypeError(argName, bnLike, argValue);
        }
    }
}
async function callInternal(account, contractId, methodName, args, opts) {
    validateBNLike({ gas: opts?.gas, amount: opts?.attachedDeposit });
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
    return (0, provider_1.getTransactionLastResult)(rawResult);
}
async function viewInternal(connection, contractId, functionName, args) {
    //* Not ideal that this logic is copied, but NAJ requires an Account to
    //* perform a view call, which isn't necessary.
    const serializedArgs = args.toString('base64');
    const result = await connection.provider.query({
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
    return (result.result && result.result.length > 0 && Buffer.from(result.result));
}
class AbiValidationError extends Error {
    constructor(error) {
        super(`ABI validation error: ${error}`);
    }
}
exports.AbiValidationError = AbiValidationError;
function serializeArgs(fn_name, args, params_abi) {
    if (args.length > 0) {
        if (!params_abi) {
            throw new AbiValidationError(`${fn_name} accepts no arguments, got ${args}`);
        }
        let param_object;
        if (args.length === params_abi.length) {
            // Serializes the arguments as a JSON object by default.
            // The reason for this is that contracts by default support object deserialization
            // and only Rust contracts support the array JSON format ambiguously.
            param_object = args.reduce((accumulator, value, idx) => {
                const key = params_abi[idx].name;
                return { ...accumulator, [key]: value };
            }, {});
        }
        else if (args.length === 1 &&
            typeof args[0] === 'object' &&
            args[0] !== null) {
            // Parameter for function call is an object, validate keys are correct
            // and serialize.
            param_object = args[0];
            const keys = Object.keys(param_object);
            if (keys.length !== params_abi.length) {
                throw new AbiValidationError(`Invalid number of fields for ${fn_name}, expected ${params_abi.length} got ${keys.length}`);
            }
            //* This doesn't validate the order of keys. If we wanted serialization to be
            //* canonical, we would check it here or sort after this method.
            for (const k of params_abi) {
                if (!param_object[k.name]) {
                    throw new AbiValidationError(`Function ${fn_name} expected key ${k.name} in parameter object`);
                }
            }
        }
        else {
            throw new AbiValidationError(`Invalid number of parameters for ${fn_name}, expected ${params_abi.length} got ${args.length}`);
        }
        // TODO serialize based on protocol in abi
        return serializeJSON(param_object);
    }
    else {
        if (params_abi) {
            throw new AbiValidationError(`Passed no parameters for ${fn_name}, expected ${params_abi.length}`);
        }
        return Buffer.alloc(0);
    }
}
class Contract {
    _connection;
    get connection() {
        return this._connection;
    }
    _contractId;
    get contractId() {
        return this._contractId;
    }
    _abi;
    get abi() {
        return this._abi;
    }
    /**
     * @param connection Connection to NEAR network through RPC.
     * @param contractId NEAR account id where the contract is deployed.
     * @param abi ABI schema which will be used to generate methods to be called on this Contract
     */
    constructor(connection, contractId, abi) {
        this._connection = connection;
        this._contractId = contractId;
        this._abi = abi;
        this._abi.abi.functions.forEach((fn) => {
            const funcName = fn.name;
            const isView = fn.is_view;
            // Create method on this contract object to be able to call methods.
            Object.defineProperty(this, funcName, {
                writable: false,
                enumerable: true,
                value: (...args) => {
                    const connection = this._connection;
                    const contractId = this._contractId;
                    // TODO support providing an object as a single parameter
                    if (fn.params && args.length !== fn.params.length) {
                        throw new AbiValidationError(`Invalid parameter length for method ${fn.name}, expected ${fn.params.length}`);
                    }
                    const func = {
                        // Include a call function if the function is not view only.
                        callFrom: isView
                            ? undefined
                            : async function (account, opts) {
                                // Using inner NAJ APIs for result for consistency, but this might
                                // not be ideal API.
                                return callInternal(account, contractId, funcName, serializeArgs(funcName, args, fn.params), opts);
                            },
                        view: async function () {
                            const returnBytes = await viewInternal(connection, contractId, funcName, serializeArgs(funcName, args, fn.params));
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
exports.Contract = Contract;
exports.testingExports = {
    serializeArgs,
};
