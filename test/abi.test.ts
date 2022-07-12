import schema from "./test_schema.json";
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
        schema
    ) as AnyContract;

    const function_call = contract.add([1, 2], [3, 4], 5);
    expect(function_call.view).toBeDefined();
    // function should be view only
    expect(function_call.callFrom).toBeUndefined();

    const serialized = testingExports.serializeArgs(
        "test",
        [[1, 2], [3, 4], 5],
        schema.abi.functions[0].params
    );
    // Serialized data should be based on ABI schema
    expect(serialized.toString()).toEqual(`{"a":[1,2],"b":[3,4],"c":5}`);

    // it's a view contract, no change.
    // let result = await contract.add([1, 2]).callFrom(account);
    // console.log(result);
    // const result = await contract.add([1, 2]).view();
    // console.log(result);
});
