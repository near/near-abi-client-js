"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testingExports = exports.Contract = exports.ContractMethods = exports.ContractMethodInvocation = exports.AbiValidationError = void 0;
const near_abi_1 = require("near-abi");
async function transactInternal(account, contractId, methodName, args, opts) {
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
function deserializeJSON(response) {
    return JSON.parse(Buffer.from(response).toString());
}
function serializeJSON(input) {
    return Buffer.from(JSON.stringify(input));
}
function serializeArgs(fn_name, args, params_abi) {
    if (args.length > 0) {
        if (!params_abi) {
            throw new AbiValidationError(`${fn_name} accepts no arguments, got ${args}`);
        }
        let param_object;
        if (args.length === params_abi.args.length) {
            // Serializes the arguments as a JSON object by default.
            // The reason for this is that contracts by default support object deserialization
            // and only Rust contracts support the array JSON format ambiguously.
            param_object = args.reduce((accumulator, value, idx) => {
                const key = params_abi.args[idx].name;
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
            if (keys.length !== params_abi.args.length) {
                throw new AbiValidationError(`Invalid number of fields for ${fn_name}, expected ${params_abi.args.length} got ${keys.length}`);
            }
            //* This doesn't validate the order of keys. If we wanted serialization to be
            //* canonical, we would check it here or sort after this method.
            for (const k of params_abi.args) {
                if (!param_object[k.name]) {
                    throw new AbiValidationError(`Function ${fn_name} expected key ${k.name} in parameter object`);
                }
            }
        }
        else {
            throw new AbiValidationError(`Invalid number of parameters for ${fn_name}, expected ${params_abi.args.length} got ${args.length}`);
        }
        // TODO serialize based on protocol in abi
        return serializeJSON(param_object);
    }
    else {
        if (params_abi) {
            throw new AbiValidationError(`Passed no parameters for ${fn_name}, expected ${params_abi.args.length}`);
        }
        return Buffer.alloc(0);
    }
}
class ContractMethodInvocation {
    #contract;
    get contract() {
        return this.#contract;
    }
    #arguments;
    get arguments() {
        return this.#arguments;
    }
    #method;
    get method() {
        return this.#method;
    }
    /**
     * @param contract NEAR Contract object
     * @param fn ABI function object
     * @param args Arguments to pass to the function
     */
    constructor(contract, fn, args) {
        [this.#method, this.#arguments, this.#contract] = [fn, args, contract];
        if (fn.kind == near_abi_1.AbiFunctionKind.View) {
            this.view = async () => {
                const returnBytes = await viewInternal(contract.connection, contract.contractId, fn.name, serializeArgs(fn.name, args, fn.params));
                // TODO deserialize based on protocol from schema
                return deserializeJSON(returnBytes);
            };
            Object.defineProperty(this.view, 'name', {
                writable: false,
                value: `ContractMethod[${fn.name}].view`,
            });
        }
        else {
            this.transact = async (account, opts) => {
                // Using inner NAJ APIs for result for consistency, but this might
                // not be ideal API.
                return transactInternal(account, contract.contractId, fn.name, serializeArgs(fn.name, args, fn.params), opts);
            };
            Object.defineProperty(this.transact, 'name', {
                writable: false,
                value: `ContractMethod[${fn.name}].transact`,
            });
        }
    }
}
exports.ContractMethodInvocation = ContractMethodInvocation;
class ContractMethods {
    /**
     * @param contract NEAR Contract object
     */
    constructor(contract) {
        if (!contract.abi)
            throw new Error("Can't create ContractMethods without ABI");
        // Create method on this contract object to be able to call methods.
        for (const fn of contract.abi.body.functions) {
            const handler = (...args) => {
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
exports.ContractMethods = ContractMethods;
class Contract {
    #connection;
    get connection() {
        return this.#connection;
    }
    #contractId;
    get contractId() {
        return this.#contractId;
    }
    #abi;
    get abi() {
        return this.#abi;
    }
    methods;
    /**
     * @param connection Connection to NEAR network through RPC.
     * @param contractId NEAR account id where the contract is deployed.
     * @param abi ABI schema which will be used to generate methods to be called on this Contract
     */
    constructor(connection, contractId, abi) {
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
exports.Contract = Contract;
exports.testingExports = {
    serializeArgs,
};
