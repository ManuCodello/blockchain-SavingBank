// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StakeToken
 * @dev Un token ERC-20 simple que genera un suministro inicial
 * para el creador del contrato. Es "Ownable" para que solo
 * el dueño pueda crear más tokens si fuera necesario en el futuro.
 */
contract StakeToken is ERC20, Ownable {
    
    // El constructor se ejecuta UNA SOLA VEZ cuando despliegas el contrato.
    constructor() ERC20("Stake Token", "STK") Ownable(msg.sender) {
        // Se crean 1,000,000 de tokens.
        // Como ERC20 usa 18 decimales por defecto, agregamos 18 ceros.
        uint256 initialSupply = 1000000 * 10**18;
        
        // _mint() es una función interna de ERC20 que crea tokens
        // y se los asigna a una dirección.
        // msg.sender es la dirección de la billetera que despliega el contrato (o sea, tú).
        _mint(msg.sender, initialSupply);
    }
}