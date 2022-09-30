import { Contract } from "../src/index";
import { testSchema } from "./testSchema";
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
    );

    const function_call = contract.methods.add([1, 2], [3, 4], 5);
    expect(function_call.view).toBeDefined();
    // function should be view only
    expect(function_call.call).toBeUndefined();

    const serializeTest = (...input: any[]) => {
        return testingExports
            .serializeArgs("test", input, testSchema.body.functions[0].params)
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
        "Passed no parameters for test, expected 3"
    );

    // ABI method with no params test
    expect(
        testingExports
            .serializeArgs("no_params", [], testSchema.body.functions[2].params)
            .toString()
    ).toStrictEqual("");

    expect(() =>
        testingExports
            .serializeArgs("no_params", ["something"], testSchema.body.functions[2].params)
            .toString()
    ).toThrow("no_params accepts no arguments, got something");

    // it's a view contract, no change.
    // let result = await contract.add([1, 2]).callFrom(account);
    // console.log(result);
    // const result = await contract.add([1, 2]).view();
    // console.log(result);
});
