export interface ABI {
    schema_version: string;
    methods: ABIFunction[];
    types: ABIType[];
}
export interface ABIFunction {
    name: string;
    is_view?: boolean;
    is_init?: boolean;
    args?: number[];
    callbacks?: any[];
    callbacks_vec?: any[];
    result: number | null;
}
export interface ABIType {
    id: number;
    schema: ABISchema;
}
export interface ABISchema {
    title: string;
    type: string | string[];
    items?: ABIItem[];
    maxItems?: number;
    minItems?: number;
}
export interface ABIItem {
    type: string;
    format: string;
    minimum?: number;
}
