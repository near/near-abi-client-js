"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbiValidationError = exports.ContractMethods = exports.ContractMethodInvocation = exports.Contract = void 0;
/** @ignore @module */
var contract_1 = require("./contract");
Object.defineProperty(exports, "Contract", { enumerable: true, get: function () { return contract_1.Contract; } });
Object.defineProperty(exports, "ContractMethodInvocation", { enumerable: true, get: function () { return contract_1.ContractMethodInvocation; } });
Object.defineProperty(exports, "ContractMethods", { enumerable: true, get: function () { return contract_1.ContractMethods; } });
Object.defineProperty(exports, "AbiValidationError", { enumerable: true, get: function () { return contract_1.AbiValidationError; } });
__exportStar(require("near-abi"), exports);
