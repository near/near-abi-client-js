import { testSchema } from "./testSchema";
import { Contract, AnyContract } from "../src/index";
import { connect, keyStores } from "near-api-js";
import { testingExports } from "../src/contract";

test("ABI deserialization", async () => {
    const keyStore = new keyStores.InMemoryKeyStore();
    const config = {
        networkId: "unittest",
        nodeUrl: "https://rpc.ci-testnet.near.org",
        masterAccount: "test.near",
        headers: {},
        deps: {
            keyStore,
        },
    };
    const near = await connect(config);
    // const account = new Account(near.connection, 'test.testnet');
    const contract = new Contract(
        near.connection,
        "test",
        testSchema
    ) as AnyContract;

    const function_call = contract.add([1, 2], [3, 4], 5);
    expect(function_call.view).toBeDefined();
    // function should be view only
    expect(function_call.callFrom).toBeUndefined();

    const serializeTest = (...input: any[]) => {
        return testingExports
            .serializeArgs("test", input, testSchema.abi.functions[0].params)
            .toString();
    };
    // Serialized data should be based on ABI schema
    expect(serializeTest([1, 2], [3, 4], 5)).toStrictEqual(
        `{"a":[1,2],"b":[3,4],"c":5}`
    );

    // Object should just be validated before serializing
    expect(serializeTest({ c: 5, a: [1, 2], b: [3, 4] })).toStrictEqual(
        `{"c":5,"a":[1,2],"b":[3,4]}`
    );

    // Invalid length of parameters
    expect(() => serializeTest([1, 2], [3, 4])).toThrow(
        "Invalid number of parameters for test, expected 3 got 2"
    );

    // Missing parameter on object
    expect(() => serializeTest({ a: [1, 2], b: [3, 4] })).toThrow(
        "Invalid number of fields for test, expected 3 got 2"
    );

    // Extra field on parameter
    expect(() =>
        serializeTest({ a: [1, 2], b: [3, 4], c: 5, d: "extra" })
    ).toThrow("Invalid number of fields for test, expected 3 got 4");

    // No parameters
    expect(() => serializeTest()).toThrow(
        "Invalid number of parameters for test, expected 3 got 0"
    );

    // it's a view contract, no change.
    // let result = await contract.add([1, 2]).callFrom(account);
    // console.log(result);
    // const result = await contract.add([1, 2]).view();
    // console.log(result);
});
