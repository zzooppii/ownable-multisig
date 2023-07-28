const { ethers } = require("hardhat");

const {
    time,
    loadFixture,
    mine,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");

describe("Multisig", function () {
// We define a fixture to reuse the same setup in every test.
// We use loadFixture to run this setup once, snapshot that state,
// and reset Hardhat Network to that snapshot in every test.
    async function deployMultisigFixture() {

        const [owner1, owner2, owner3] = await ethers.getSigners();
        //owner1 : 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
        //owner2 : 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
        //owner3 : 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

        const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
        
        const multisig = await MultiSigWallet.deploy([owner1, owner2, owner3], 2 , {});

        return {multisig, owner1, owner2, owner3};
    };

    async function deployTestTokenFixture() {
        const [owner1, owner2, owner3] = await ethers.getSigners();
        const TestToken = await ethers.getContractFactory("TestToken");

        const weiAmount = ethers.parseUnits("1000", "ether");


        //transfer token to multisig and account2
        const testToken = await TestToken.deploy(weiAmount, {});

        let amount1 = ethers.parseEther("100","ether");
        let amount2 = ethers.parseEther("200","ether");

        let tx1 = testToken.transfer(multisig.target, amount1);
        let tx2 = testToken.transfer(owner2, amount2);
        
        await mine(1);
        //owner1   = 700 testToken
        //owner2   = 200 testToken
        //multisig = 100 testToken

        return {testToken};
    }

    it("Should all accounts to be set", async function () {
        let {multisig, owner1, owner2, owner3} = await loadFixture(deployMultisigFixture);
        expect(await multisig.isOwner(owner1)).to.equal(true);
        expect(await multisig.isOwner(owner2)).to.equal(true);
        expect(await multisig.isOwner(owner3)).to.equal(true);
    });

    it("Should first account be a master", async function () {
        let {multisig, owner1, owner2, owner3} = await loadFixture(deployMultisigFixture);
        expect(await multisig.isMaster(owner1)).to.equal(true);
    });

    it("Should one of owner be changed", async function () {
        let {multisig, owner1, owner2, owner3} = await loadFixture(deployMultisigFixture);
        let signers = await ethers.getSigners();
        // owner4 : 0x90F79bf6EB2c4f870365E785982E1f101E93b906
        let owner4 = signers[3];
        // console.log(owner4);
        // change first owner to owner4
        await multisig.changeOwner(0, owner4);
        await mine(1);

        expect(await multisig.isOwner(owner1)).to.equal(false);
        expect(await multisig.isOwner(owner4)).to.equal(true);
    });

    it("Should only Master change owner", async function () {
        let {multisig, owner1, owner2, owner3} = await loadFixture(deployMultisigFixture);
        let signers = await ethers.getSigners();
        // owner4 : 0x90F79bf6EB2c4f870365E785982E1f101E93b906
        let owner4 = signers[3];
        // ?? WHY NO NEED "await" HERE
        let tx = multisig.connect(owner2).changeOwner(0, owner4);
        await expect(tx).to.be.revertedWith(
            "not master"
          );
    });
    it("Should Master be changed", async function () {
        let {multisig, owner1, owner2, owner3} = await loadFixture(deployMultisigFixture);
        let signers = await ethers.getSigners();
        // owner4 : 0x90F79bf6EB2c4f870365E785982E1f101E93b906
        let owner4 = signers[3];
        await multisig.changeMaster(owner4);
        expect(await multisig.isMaster(owner4)).to.equal(true);
    });
    // it("Should Master withdraw token");
    // it("Can Owner submit transaction");
    // it("Should submitted transaction confirm to be 1")
    // it("Should not non-owner submit trasaction");
    // it("Confirm 1 submitted transaction");
    // it("Should not non-owner confirm trasaction");
    // it("Should required confirmed executed");
    // it("Should not less required confirmed executed");
    // it("Should revoke work");

});