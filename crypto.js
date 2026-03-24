const Web3 = require('web3');
const { Transaction } = require('@ethereumjs/tx');
const Common = require('@ethereumjs/common').default;
require('dotenv').config();

/**
 * Clase para la integración con criptomonedas usando Web3.js
 */
class CryptoAPI {
  constructor(providerUrl) {
    this.web3 = new Web3(providerUrl);
    this.chainId = null;
    this.networkType = null;
    this.initialize();
  }

  /**
   * Inicializa la conexión y obtiene información de la red
   */
  async initialize() {
    try {
      this.networkType = await this.web3.eth.net.getNetworkType();
      this.chainId = await this.web3.eth.getChainId();
      console.log(`Conectado a la red ${this.networkType} con chainId ${this.chainId}`);
    } catch (error) {
      console.error('Error al inicializar la conexión con la blockchain:', error.message);
      throw error;
    }
  }

  /**
   * Crea una nueva cuenta Ethereum
   * @returns {Object} Nueva cuenta
   */
  createAccount() {
    try {
      const account = this.web3.eth.accounts.create();
      return {
        address: account.address,
        privateKey: account.privateKey
      };
    } catch (error) {
      console.error('Error al crear cuenta Ethereum:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene el balance de una dirección
   * @param {string} address - Dirección Ethereum
   * @returns {Promise<string>} Balance en ETH
   */
  async getBalance(address) {
    try {
      const balanceWei = await this.web3.eth.getBalance(address);
      const balanceEth = this.web3.utils.fromWei(balanceWei, 'ether');
      return balanceEth;
    } catch (error) {
      console.error('Error al obtener balance:', error.message);
      throw error;
    }
  }

  /**
   * Envía ETH de una cuenta a otra
   * @param {Object} transactionData - Datos de la transacción
   * @returns {Promise<Object>} Recibo de la transacción
   */
  async sendTransaction(transactionData) {
    try {
      const { fromAddress, privateKey, toAddress, amount, gasLimit, gasPrice } = transactionData;
      
      // Convertir ETH a Wei
      const amountWei = this.web3.utils.toWei(amount.toString(), 'ether');
      
      // Obtener el nonce para la dirección de origen
      const nonce = await this.web3.eth.getTransactionCount(fromAddress, 'latest');
      
      // Preparar la transacción
      const txData = {
        nonce: this.web3.utils.toHex(nonce),
        to: toAddress,
        value: this.web3.utils.toHex(amountWei),
        gasLimit: this.web3.utils.toHex(gasLimit || 21000),
        gasPrice: this.web3.utils.toHex(gasPrice || await this.web3.eth.getGasPrice()),
        chainId: this.chainId
      };
      
      // Firmar la transacción
      const signedTx = await this.web3.eth.accounts.signTransaction(txData, privateKey);
      
      // Enviar la transacción firmada
      const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      
      return receipt;
    } catch (error) {
      console.error('Error al enviar transacción:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene información de una transacción
   * @param {string} txHash - Hash de la transacción
   * @returns {Promise<Object>} Información de la transacción
   */
  async getTransaction(txHash) {
    try {
      const transaction = await this.web3.eth.getTransaction(txHash);
      return transaction;
    } catch (error) {
      console.error('Error al obtener información de transacción:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene el recibo de una transacción
   * @param {string} txHash - Hash de la transacción
   * @returns {Promise<Object>} Recibo de la transacción
   */
  async getTransactionReceipt(txHash) {
    try {
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      console.error('Error al obtener recibo de transacción:', error.message);
      throw error;
    }
  }

  /**
   * Estima el gas necesario para una transacción
   * @param {Object} txData - Datos de la transacción
   * @returns {Promise<number>} Estimación de gas
   */
  async estimateGas(txData) {
    try {
      const gasEstimate = await this.web3.eth.estimateGas({
        from: txData.from,
        to: txData.to,
        value: this.web3.utils.toWei(txData.value.toString(), 'ether')
      });
      return gasEstimate;
    } catch (error) {
      console.error('Error al estimar gas:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene el precio actual del gas
   * @returns {Promise<string>} Precio del gas en Wei
   */
  async getGasPrice() {
    try {
      const gasPrice = await this.web3.eth.getGasPrice();
      return gasPrice;
    } catch (error) {
      console.error('Error al obtener precio del gas:', error.message);
      throw error;
    }
  }

  /**
   * Despliega un contrato inteligente
   * @param {Object} contractData - Datos del contrato
   * @returns {Promise<Object>} Contrato desplegado
   */
  async deployContract(contractData) {
    try {
      const { abi, bytecode, fromAddress, privateKey, constructorArgs, gasLimit, gasPrice } = contractData;
      
      // Crear instancia del contrato
      const contract = new this.web3.eth.Contract(abi);
      
      // Preparar la transacción de despliegue
      const deployTx = contract.deploy({
        data: bytecode,
        arguments: constructorArgs || []
      });
      
      // Obtener el nonce para la dirección de origen
      const nonce = await this.web3.eth.getTransactionCount(fromAddress, 'latest');
      
      // Preparar los datos de la transacción
      const txData = {
        nonce: this.web3.utils.toHex(nonce),
        data: deployTx.encodeABI(),
        gasLimit: this.web3.utils.toHex(gasLimit || await deployTx.estimateGas({ from: fromAddress })),
        gasPrice: this.web3.utils.toHex(gasPrice || await this.web3.eth.getGasPrice()),
        chainId: this.chainId
      };
      
      // Firmar la transacción
      const signedTx = await this.web3.eth.accounts.signTransaction(txData, privateKey);
      
      // Enviar la transacción firmada
      const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      
      // Crear instancia del contrato desplegado
      const deployedContract = new this.web3.eth.Contract(abi, receipt.contractAddress);
      
      return {
        contract: deployedContract,
        address: receipt.contractAddress,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error al desplegar contrato:', error.message);
      throw error;
    }
  }

  /**
   * Interactúa con un contrato inteligente
   * @param {Object} contractData - Datos del contrato
   * @returns {Promise<Object>} Resultado de la interacción
   */
  async callContractMethod(contractData) {
    try {
      const { 
        contractAddress, 
        abi, 
        methodName, 
        methodArgs, 
        fromAddress, 
        privateKey, 
        value,
        gasLimit,
        gasPrice
      } = contractData;
      
      // Crear instancia del contrato
      const contract = new this.web3.eth.Contract(abi, contractAddress);
      
      // Preparar la llamada al método
      const method = contract.methods[methodName](...(methodArgs || []));
      
      // Verificar si es una llamada de lectura (call) o escritura (send)
      if (!privateKey) {
        // Llamada de lectura (no requiere transacción)
        const result = await method.call({ from: fromAddress });
        return { result };
      } else {
        // Llamada de escritura (requiere transacción)
        // Obtener el nonce para la dirección de origen
        const nonce = await this.web3.eth.getTransactionCount(fromAddress, 'latest');
        
        // Preparar los datos de la transacción
        const txData = {
          nonce: this.web3.utils.toHex(nonce),
          to: contractAddress,
          data: method.encodeABI(),
          value: value ? this.web3.utils.toHex(this.web3.utils.toWei(value.toString(), 'ether')) : '0x0',
          gasLimit: this.web3.utils.toHex(gasLimit || await method.estimateGas({ from: fromAddress })),
          gasPrice: this.web3.utils.toHex(gasPrice || await this.web3.eth.getGasPrice()),
          chainId: this.chainId
        };
        
        // Firmar la transacción
        const signedTx = await this.web3.eth.accounts.signTransaction(txData, privateKey);
        
        // Enviar la transacción firmada
        const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        
        return receipt;
      }
    } catch (error) {
      console.error('Error al interactuar con contrato:', error.message);
      throw error;
    }
  }

  /**
   * Genera una billetera para un usuario
   * @param {string} userId - ID del usuario
   * @param {string} password - Contraseña para encriptar la billetera
   * @returns {Promise<Object>} Billetera generada
   */
  async generateWallet(userId, password) {
    try {
      const account = this.createAccount();
      const encryptedWallet = await this.web3.eth.accounts.encrypt(account.privateKey, password);
      
      return {
        userId,
        address: account.address,
        encryptedWallet
      };
    } catch (error) {
      console.error('Error al generar billetera:', error.message);
      throw error;
    }
  }

  /**
   * Desencripta una billetera
   * @param {Object} encryptedWallet - Billetera encriptada
   * @param {string} password - Contraseña para desencriptar
   * @returns {Promise<Object>} Billetera desencriptada
   */
  async decryptWallet(encryptedWallet, password) {
    try {
      const decryptedWallet = await this.web3.eth.accounts.decrypt(encryptedWallet, password);
      return decryptedWallet;
    } catch (error) {
      console.error('Error al desencriptar billetera:', error.message);
      throw error;
    }
  }

  /**
   * Convierte Wei a ETH
   * @param {string|number} wei - Cantidad en Wei
   * @returns {string} Cantidad en ETH
   */
  weiToEth(wei) {
    return this.web3.utils.fromWei(wei.toString(), 'ether');
  }

  /**
   * Convierte ETH a Wei
   * @param {string|number} eth - Cantidad en ETH
   * @returns {string} Cantidad en Wei
   */
  ethToWei(eth) {
    return this.web3.utils.toWei(eth.toString(), 'ether');
  }
}

module.exports = CryptoAPI;
