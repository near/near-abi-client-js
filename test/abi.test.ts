import schema from "./test_schema.json";
import { Contract } from '../src/index';
import { Account, connect, keyStores } from 'near-api-js';

test('ABI deserialization', async () => {
    const keyStore = new keyStores.InMemoryKeyStore();
    const config = {
        networkId: 'unittest',
        nodeUrl: 'https://rpc.ci-testnet.near.org',
        masterAccount: 'test.near',
        headers: {},
        deps: {
            keyStore
        }
    };
    const near = await connect(config);
    new Account(near.connection, 'test.testnet');
    const contract = new Contract(near.connection, 'test', schema);

    // const function_call = contract.add([1, 2]);
    // expect(function_call.view !== undefined);
    // // function should be view only
    // expect(function_call.callFrom === undefined);

    // console.log(contract);
    // console.log(contract.add([1, 2]));

    // it's a view contract, no change.
    // let result = await contract.add([1, 2]).callFrom(account);
    // console.log(result);
    // const result = await contract.add([1, 2]).view();
    // console.log(result);
});