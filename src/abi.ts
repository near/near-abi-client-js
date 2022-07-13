export interface ABI {
    abi_schema_version: string;
    metadata?: ContractMetadata;
    abi: ABIData;
}

export interface ABIData {
    functions: ABIFunction[];
    /** Root JSON schema for the ABI */
    root_schema: any;
}

export interface ContractMetadata {
    name?: string;
    version?: string;
    authors?: string[];
}

export interface ABIFunction {
    name: string;
    is_view?: boolean;
    is_init?: boolean;
    is_payable?: boolean;
    is_private?: boolean;
    params?: ABIParameterInfo[];
    callbacks?: any[];
    callbacks_vec?: ABITypeInfo;
    result?: ABITypeInfo;
}

export interface ABITypeInfo {
    type_schema: Reference | ABIType;
    serialization_type: string;
}

export interface ABIParameterInfo extends ABITypeInfo {
    name: string;
}

export interface Reference {
    $ref: string;
}

export interface ABIType {
    type: string;
    // TODO make this constrained. Likely need to handle all data types
    [k: string]: any;
}

