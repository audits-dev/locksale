pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";

contract Token is ERC20Mintable {
  string public name = "LockSale Token";
  string public symbol = "LST";
  uint8 public decimals = 18;

  constructor(address _wallet, uint256 _initialSupply) public {
    _mint(_wallet, _initialSupply);
  }
}