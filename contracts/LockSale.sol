pragma solidity 0.5.7;

import "./Token.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract LockSale {
  using SafeMath for uint256;

  uint256 public rate;
  uint256 public lockDuration;
  uint256 public totalLocked;
  Token public token;

  struct Locker {
    uint256 lockTimestamp;
    uint256 lockedAmount;
  }

  mapping(address => Locker) public lockedBalances;

  event Withdraw(address user, uint256 amount);

  constructor(uint256 _initialSupply, uint256 _rate, uint256 _lockDuration) public payable {
    require(_initialSupply == _rate.mul(msg.value), "Must send initial deposit");
    rate = _rate;
    lockDuration = _lockDuration;
    addBalance(msg.sender, msg.value);
    token = new Token(msg.sender, _initialSupply);
  }

  function () external payable {
    require(msg.value > 0, "LockSale: 0 ether sent");
    addBalance(msg.sender, msg.value);
    require(token.mint(msg.sender, rate.mul(msg.value)), "LockSale: failed to mint tokens");
  }

  function withdraw(uint256 _amount) public {
    require(lockedBalances[msg.sender].lockTimestamp < now.sub(lockDuration), "LockSale: lock duration not passed");
    require(lockedBalances[msg.sender].lockedAmount >= _amount, "LockSale: insufficient balance");
    subBalance(msg.sender, _amount);
    emit Withdraw(msg.sender, _amount);
    address(msg.sender).transfer(_amount);
  }

  function addBalance(address _sender, uint256 _amount) private {
    lockedBalances[_sender].lockedAmount = lockedBalances[_sender].lockedAmount.add(_amount);
    lockedBalances[_sender].lockTimestamp = now;
    totalLocked = totalLocked.add(_amount);
  }

  function subBalance(address _sender, uint256 _amount) private {
    lockedBalances[_sender].lockedAmount = lockedBalances[_sender].lockedAmount.sub(_amount);
    if(lockedBalances[_sender].lockedAmount == 0) {
      delete lockedBalances[_sender]; // clean up storage for lockTimestamp
    }
    totalLocked = totalLocked.sub(_amount);
  }
}