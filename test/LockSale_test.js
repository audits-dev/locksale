
/**
 * This file was created by truffle-test-generator.
 * For every test, a new contract will be created in the
 * top beforeEach block. This line uses the arguments for
 * your contract's constructor with the same variable names.
 * Each public, non-constant (view) method has a describe
 * block generated for it.
 */
const { BN, balance, constants, expectEvent, shouldFail, time } = require('openzeppelin-test-helpers')
const { expect } = require('chai')
const LockSale = artifacts.require('LockSale')
const Token = artifacts.require('Token')

const implements = (contract, method) => {
  for (let i = 0; i < contract.abi.length; i++) {
    if(contract.abi[i].name == method) return true
  }
  return false
}

contract('LockSale', (accounts) => {
  const maintainer = accounts[0]
  const user1 = accounts[1]
  const user2 = accounts[2]
  const stranger = accounts[3]

  let locksale
  let token

  const name = 'LockSale Token'
  const symbol = 'LST'
  const decimals = 18

  const _initialSupply = new BN('1000000000000000000000')
  const _rate = new BN('1000')
  const _lockDuration = 31536000 // 365 days

  const initialDeposit = web3.utils.toWei('1', 'ether')

  let deploymentTime

  beforeEach(async () => {
    locksale = await LockSale.new(
      _initialSupply,
      _rate,
      _lockDuration,
      {from: maintainer, value: initialDeposit})
    deploymentTime = await time.latest()
    tokenAddress = await locksale.token()
    token = await Token.at(tokenAddress)
  })

  describe('lockedBalances', () => {
    it('should return the initial deposit amount for the contract deployer', async () => {
      const { lockedAmount } = await locksale.lockedBalances.call(maintainer)
      expect(lockedAmount).to.be.bignumber.equal(initialDeposit)
    })

    it('should return the locked timestamp for the contract deployer', async () => {
      const { lockTimestamp } = await locksale.lockedBalances.call(maintainer)
      // allow for Math.trunc rounding; contract does not rely on to-the-second accuracy
      expect(lockTimestamp).to.be.bignumber.equal(deploymentTime)
    })
  })

  describe('lockDuration', () => {
    it('should return the value equal to what the contract was deployed with', async () => {
      assert.equal(await locksale.lockDuration(), _lockDuration)
    })
  })

  describe('rate', () => {
    it('should return the value equal to what the contract was deployed with', async () => {
      expect(await locksale.rate()).to.be.bignumber.equal(_rate)
    })
  })

  describe('totalLocked', () => {
    it('should return the initial deposit amount on deployment', async () => {
      expect(await locksale.totalLocked()).to.be.bignumber.equal(initialDeposit)
    })
  })

  describe('token', () => {
    it('should return the address of the token contract', async () => {
      assert.equal(await locksale.token(), token.address)
    })

    it('should deploy with the initial balance available on the caller', async () => {
      expect(await token.balanceOf(maintainer)).to.be.bignumber.equal(_initialSupply)
    })

    it('should implement the mint function', async () => {
      expect(implements(token, 'mint')).to.be.true
    })

    it('should use the locksale as the only minter', async () => {
      expect(await token.isMinter(locksale.address)).to.be.true
      expect(await token.isMinter(maintainer)).to.be.false
    })
  })

  describe('fallback', () => {
    it(`should transfer tokens to the caller at a rate of 1 ETH = ${_rate} tokens`, async () => {
      const amount = new BN(web3.utils.toWei('3', 'ether'))
      await web3.eth.sendTransaction({
        from: user1,
        to: locksale.address,
        value: amount,
        gas: 100000
      })
      expect(await token.balanceOf(user1)).to.be.bignumber.equal(amount.mul(_rate))
    })

    it('should throw with zero-value transfers', async () => {
      await shouldFail.reverting.withMessage(web3.eth.sendTransaction({
        from: user1,
        to: locksale.address,
        value: 0,
        gas: 100000
      }), 'LockSale: 0 ether sent')
    })

    context('after sending ETH to the LockSale contract', () => {
      let sendAmount, sendTime

      beforeEach(async () => {
        sendAmount = new BN(web3.utils.toWei('3', 'ether'))
        await web3.eth.sendTransaction({
          from: user1,
          to: locksale.address,
          value: sendAmount,
          gas: 100000
        })
        sendTime = await time.latest()
      })

      it('should increase the token totalSupply by the correct rate', async () => {
        const additionalPurchase = new BN(sendAmount).mul(_rate)
        expect(await token.totalSupply()).to.be.bignumber.equal(additionalPurchase.add(_initialSupply))
      })

      it('should set the lockTimestamp for the sender', async () => {
        const { lockTimestamp } = await locksale.lockedBalances.call(user1)
        expect(lockTimestamp).to.be.bignumber.equal(sendTime)
      })

      it('should set the lockedAmount for the sender', async () => {
        const { lockedAmount } = await locksale.lockedBalances.call(user1)
        expect(lockedAmount).to.be.bignumber.equal(sendAmount)
      })

      it('should not effect other users balances', async () => {
        const { lockedAmount } = await locksale.lockedBalances.call(maintainer)
        expect(lockedAmount).to.be.bignumber.equal(initialDeposit)
      })

      it('should add to user balances independently', async () => {
        const user2SendAmount = new BN(web3.utils.toWei('8', 'ether'))
        await web3.eth.sendTransaction({
          from: user2,
          to: locksale.address,
          value: user2SendAmount,
          gas: 100000
        })
        const user2SendTime = await time.latest()
        const locker2 = await locksale.lockedBalances.call(user2)
        expect(locker2.lockTimestamp).to.be.bignumber.equal(user2SendTime)
        expect(locker2.lockedAmount).to.be.bignumber.equal(user2SendAmount)
      })

      context('after sending ETH at a later date', () => {
        let newSendAmount, newSendTime

        beforeEach(async () => {
          await time.increase(2592000) // 30 days
          await time.advanceBlock()

          newSendAmount = new BN(web3.utils.toWei('2', 'ether'))
          await web3.eth.sendTransaction({
            from: user1,
            to: locksale.address,
            value: newSendAmount,
            gas: 55000
          })
          newSendTime = await time.latest()
        })

        it('should update the lockTimestamp', async () => {
          const { lockTimestamp } = await locksale.lockedBalances.call(user1)
          expect(lockTimestamp).to.be.bignumber.equal(newSendTime)
        })

        it('should update the lockedAmount', async () => {
          const { lockedAmount } = await locksale.lockedBalances.call(user1)
          expect(lockedAmount).to.be.bignumber.equal(sendAmount.add(newSendAmount))
        })
      })
    })
  })

  describe('withdraw', () => {

    let sendAmount, sendTime

    beforeEach(async () => {
      sendAmount = new BN(web3.utils.toWei('3', 'ether'))
      await web3.eth.sendTransaction({
        from: user1,
        to: locksale.address,
        value: sendAmount,
        gas: 100000
      })
      sendTime = await time.latest()
    })

    it('should throw if the lockDuration has not passed', async () => {
      const { lockTimestamp } = await locksale.lockedBalances.call(user1)
      expect(sendTime).to.be.bignumber.equal(lockTimestamp)
      await shouldFail.reverting.withMessage(
        locksale.withdraw(0, { from: user1 }), 'LockSale: lock duration not passed'
      )
    })

    it('should throw if the amount requested is greater than the callers balance', async () => {
      await shouldFail.reverting.withMessage(
        locksale.withdraw(sendAmount, { from: stranger }), 'LockSale: insufficient balance'
      )
    })

    context('after the lockDuration has passed', () => {
      beforeEach(async () => {
        await time.increase(_lockDuration + 1)
        await time.advanceBlock()
      })

      it('should throw if the amount requested is greater than the callers balance', async () => {
        const newSendAmount = new BN(1).add(sendAmount)
        await shouldFail.reverting.withMessage(
          locksale.withdraw(newSendAmount, { from: user1 }), 'LockSale: insufficient balance'
        )
      })

      it('should allow the caller to withdraw a partial amount', async () => {
        const withdrawAmount = new BN(web3.utils.toWei('2', 'ether'))
        const balanceTracker = await balance.tracker(user1)
        const beforeBalance = await balanceTracker.get()
        const { receipt } = await locksale.withdraw(withdrawAmount, { from: user1 })
        const { gasPrice } = await web3.eth.getTransaction(receipt.transactionHash)
        const spentGas = new BN(receipt.gasUsed).mul(new BN(gasPrice))
        const afterBalance = await balanceTracker.get()
        const calcBefore = new BN(beforeBalance.add(withdrawAmount))
        const calcAfter = new BN(afterBalance).add(spentGas)
        expect(calcAfter).to.be.bignumber.equal(calcBefore)
      })

      it('should allow the caller to withdraw their full amount', async () => {
        const { lockedAmount } = await locksale.lockedBalances.call(user1)
        const balanceTracker = await balance.tracker(user1)
        const beforeBalance = await balanceTracker.get()
        const { receipt } = await locksale.withdraw(lockedAmount, { from: user1 })
        const { gasPrice } = await web3.eth.getTransaction(receipt.transactionHash)
        const spentGas = new BN(receipt.gasUsed).mul(new BN(gasPrice))
        const afterBalance = await balanceTracker.get()
        const calcBefore = new BN(beforeBalance.add(lockedAmount))
        const calcAfter = new BN(afterBalance).add(spentGas)
        expect(calcAfter).to.be.bignumber.equal(calcBefore)
      })

      it('should emit a Withdraw event', async () => {
        const { lockedAmount } = await locksale.lockedBalances.call(user1)
        const { logs } = await locksale.withdraw(lockedAmount, { from: user1 })
        expectEvent.inLogs(logs, 'Withdraw', { user: user1, amount: lockedAmount })
      })
    })
  })
})
