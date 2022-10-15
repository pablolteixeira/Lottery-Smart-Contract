const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");

const web3 = new Web3(ganache.provider());

const { abi, evm } = require('../compile');

let lottery;
let accounts;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    lottery = await new web3.eth.Contract(abi)
        .deploy({ data: evm.bytecode.object })
        .send({ gas: "1000000", from: accounts[0] });
});

describe("Lottery Contract", () => {
    it("It deploys a contract", () => {
        assert.ok(lottery.options.address);
    })

    it("allows one account to enter", async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei("0.02", "ether")
        });
        
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })

        assert.equal(accounts[0], players[0]);
        assert.equal(1, players.length);
    });

    it("allows multiple accounts to enter", async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei("0.02", "ether")
        });

        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei("0.02", "ether")
        });

        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei("0.02", "ether")
        });

        await lottery.methods.enter().send({
            from: accounts[3],
            value: web3.utils.toWei("0.02", "ether")
        });
        
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })

        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
        assert.equal(accounts[3], players[3]);
        assert.equal(4, players.length);
    });

    it("requires a minimum amount of ether to enter", async () => {
        try{
            await lottery.methods.enter().send({
                from: accounts[0],
                value: web3.utils.toWei("0.02", "ether")
            });
            assert(false);
        } catch (err) {
            assert(err);
        }
    })

    it("only manager can call pickWinner", async () => {
        try{
            await lottery.methods.pickWinner().send({
                from: accounts[0],
            });
        } catch (err) {
            assert(err);
            return;
        }
        assert(false);
    })

    it("sends money to the winner and resets the players array", async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei("2", "ether")
        });

        const initialBalance = await web3.eth.getBalance(accounts[0]);
        await lottery.methods.pickWinner().send({ from: accounts[0] });
        const finalBalance = await web3.eth.getBalance(accounts[0]);
        const difference =  finalBalance - initialBalance;
        
        const players = await lottery.methods.getPlayers().call({ from: accounts[0] });

        assert(difference > web3.utils.toWei("1.8", "ether"));
        assert.equal(players.length, 0);
    })

    it("manager should be equal to first account from accountss", async () => {
        const manager = await lottery.methods.manager().call();
        assert.equal(accounts[0], manager);
    })
});