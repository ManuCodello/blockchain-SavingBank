// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SavingsContract
 * @dev Un contrato de ahorro donde los usuarios pueden depositar múltiples veces
 * y solo pueden retirar todo su saldo después de una fecha de desbloqueo global.
 */
contract SavingsContract is Ownable, ReentrancyGuard {
    
    IERC20 public immutable stakeToken;
    
    // VARIABLES CLAVE
    uint256 public constant REWARD_RATE_PER_YEAR = 10; // 10% de recompensa anual (APR)
    uint256 public immutable unlockDate;              // La fecha en que se liberan los fondos

    // Estructura para guardar la información de cada ahorrador
    struct Savings {
        uint256 totalAmount;        // La cantidad total que ha depositado
        uint256 accumulatedReward;  // La recompensa que ya ha sido calculada y "guardada"
        uint256 lastUpdateTime;     // El momento del último depósito o cálculo
    }

    // Mapeo para asociar una dirección de usuario con sus ahorros
    mapping(address => Savings) public savers;
    
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 totalAmount, uint256 totalReward);

    /**
     * @dev El constructor define el token y el período de bloqueo.
     * @param _stakeTokenAddress La dirección del token STK.
     * @param _lockDurationInDays La cantidad de días que los fondos estarán bloqueados.
     */
    constructor(address _stakeTokenAddress, uint256 _lockDurationInDays) Ownable(msg.sender) {
        stakeToken = IERC20(_stakeTokenAddress);
        // Calcula la fecha de desbloqueo sumando la duración al momento actual
        unlockDate = block.timestamp + (_lockDurationInDays * 1 days);
    }

    /**
     * @notice Calcula la recompensa generada desde la última actualización.
     */
    function calculatePendingReward(address _user) public view returns (uint256) {
        Savings storage userSavings = savers[_user];
        if (userSavings.totalAmount == 0) {
            return 0;
        }
        
        uint256 timeElapsed = block.timestamp - userSavings.lastUpdateTime;
        // Fórmula: (principal * tasa * tiempo) / (segundos_en_un_año * 100)
        return (userSavings.totalAmount * REWARD_RATE_PER_YEAR * timeElapsed) / (365 days * 100);
    }

    /**
     * @notice Permite a un usuario depositar tokens STK en cualquier momento.
     */
    function deposit(uint256 _amount) external nonReentrant {
        require(_amount > 0, "La cantidad debe ser mayor a cero");

        Savings storage userSavings = savers[msg.sender];

        // 1. Calcula la recompensa pendiente sobre el saldo anterior y la acumula
        uint256 pendingReward = calculatePendingReward(msg.sender);
        userSavings.accumulatedReward += pendingReward;

        // 2. Transfiere los nuevos tokens desde el usuario hacia el contrato
        bool success = stakeToken.transferFrom(msg.sender, address(this), _amount);
        require(success, "La transferencia de tokens fallo");

        // 3. Actualiza el saldo total y la fecha del último movimiento
        userSavings.totalAmount += _amount;
        userSavings.lastUpdateTime = block.timestamp;
        
        emit Deposited(msg.sender, _amount);
    }

    /**
     * @notice Permite a un usuario retirar su saldo total (depósitos + recompensas)
     * solo después de la fecha de desbloqueo.
     */
    function withdraw() external nonReentrant {
        // VERIFICACIÓN CLAVE: Solo se puede retirar después de la fecha de desbloqueo
        require(block.timestamp >= unlockDate, "Los fondos aun no pueden ser retirados");
        
        Savings storage userSavings = savers[msg.sender];
        require(userSavings.totalAmount > 0, "No tienes fondos para retirar");

        // 1. Calcula la última recompensa generada hasta el momento del retiro
        uint256 finalReward = calculatePendingReward(msg.sender);
        uint256 totalReward = userSavings.accumulatedReward + finalReward;
        uint256 totalBalance = userSavings.totalAmount + totalReward;

        // 2. Borra el registro del usuario para evitar dobles retiros y liberar gas
        delete savers[msg.sender];

        // 3. Transfiere el monto total (depósitos + todas las recompensas) al usuario
        bool success = stakeToken.transfer(msg.sender, totalBalance);
        require(success, "La transferencia de retiro fallo");
        
        emit Withdrawn(msg.sender, userSavings.totalAmount, totalReward);
    }
}