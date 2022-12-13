const forwarderOrigin = 'http://localhost:9010';

const initialize = () => {

    // Dapp Status Section
    const networkDiv = document.getElementById('network')
    const chainIdDiv = document.getElementById('chainId')
    const accountsDiv = document.getElementById('accounts')

    //Basic Actions Section
    const onboardButton = document.getElementById('connectButton');
    const getAccountsButton = document.getElementById('getAccounts');
    const getAccountsResult = document.getElementById('getAccountsResult');

    //Ethereum Bridge Contract Section
    const contractAddressEthereum = document.getElementById('ethereumBridgeAddress');
    const transferToPolygonButton = document.getElementById('btnTransferToPolygon');
    const unstakeButton = document.getElementById('btnUnstake');
    const tokenStakingButton = document.getElementById('btnTokenStaking');
    const instanciateEthereumBridgeContractButton = document.getElementById('btnInstanciateEthereumBridgeContract');

    //ERC-20 Ethereum Contract Section
    const contractAddressERC20Ethereum = document.getElementById('erc20EthereumAddress');
    const approveERC20EthButton = document.getElementById('btnApproveERC20Eth');
    const transferERC20ETHButton = document.getElementById('btnTransferERC20Eth');
    const instanciateERC20EthereumContractButton = document.getElementById('btnInstanciateERC20EthereumContract');
    erc20EthereumContractStatus

    //Polygon Bridge Contract Section
    const contractAddressPolygon = document.getElementById('polygonBridgeAddress');
    const mintToButton = document.getElementById('btnMintTo');
    const transferToEthereumButton = document.getElementById('btnTransferToEthereum');
    const instanciatePolygonBridgeContractButton = document.getElementById('btnInstanciatePolygonBridgeContract');

    let accounts
    let accountButtonsInitialized = false
    let contractEthereumBridgeInstance
    let contractERC20EthereumInstance
    let contractPolygonBridgeInstance
    let polygonBridgeABI
    let ethereumBridgeABI
    let web3

    const isMetaMaskConnected = () => accounts && accounts.length > 0

    //Created check function to see if the MetaMask extension is installed
    const isMetaMaskInstalled = () => {
        //Have to check the ethereum binding on the window object to see if it's installed
        const { ethereum } = window;
        return Boolean(ethereum && ethereum.isMetaMask);
    };

    //We create a new MetaMask onboarding object to use in our app
    const onboarding = new MetaMaskOnboarding({ forwarderOrigin });

    const updateButtons = () => {
        if (!isMetaMaskInstalled()) {
            onboardButton.innerText = 'Click here to install MetaMask!'
            onboardButton.onclick = onClickInstall
            onboardButton.disabled = false
            contractAddressEthereum.disabled = true;
            transferToPolygonButton.disabled = true;
            unstakeButton.disabled = true;
            contractAddressPolygon.disabled = true;
            mintToButton.disabled = true;
            transferToEthereumButton.disabled = true;
        } else if (isMetaMaskConnected()) {
            onboardButton.innerText = 'Connected'
            onboardButton.disabled = true
            if (onboarding) {
                onboarding.stopOnboarding()
            }
            contractAddressEthereum.disabled = false;
            transferToPolygonButton.disabled = false;
            unstakeButton.disabled = false;
            contractAddressPolygon.disabled = false;
            mintToButton.disabled = false;
            transferToEthereumButton.disabled = false;
        } else {
            onboardButton.innerText = 'Connect'
            onboardButton.onclick = onClickConnect
            onboardButton.disabled = false
            contractAddressEthereum.disabled = true;
            transferToPolygonButton.disabled = true;
            unstakeButton.disabled = true;
            contractAddressPolygon.disabled = true;
            mintToButton.disabled = true;
            transferToEthereumButton.disabled = true;
        }
    }

    //This will start the onboarding proccess
    const onClickInstall = () => {
        onboardButton.innerText = 'Onboarding in progress';
        onboardButton.disabled = true;
        //On this object we have startOnboarding which will start the onboarding process for our end user
        onboarding.startOnboarding();
    };

    const onClickConnect = async () => {
        try {
            const newAccounts = await ethereum.request({
                method: 'eth_requestAccounts',
            })
            handleNewAccounts(newAccounts)
        } catch (error) {
            console.error(error)
        }
    };

    const MetaMaskClientCheck = () => {
        //Now we check to see if Metmask is installed
        if (!isMetaMaskInstalled()) {
            //If it isn't installed we ask the user to click to install it
            onboardButton.innerText = 'Click here to install MetaMask!';
            //When the button is clicked we call th is function
            onboardButton.onclick = onClickInstall;
            //The button is now disabled
            onboardButton.disabled = false;
        } else {
            //If MetaMask is installed we ask the user to connect to their wallet
            onboardButton.innerText = 'Connect';
            //When the button is clicked we call this function to connect the users MetaMask Wallet
            onboardButton.onclick = onClickConnect;
            //The button is now disabled
            onboardButton.disabled = false;
        }
    };

    //Eth_Accounts-getAccountsButton
    getAccountsButton.addEventListener('click', async () => {
        //we use eth_accounts because it returns a list of addresses owned by us.
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        //We take the first address in the array of addresses and display it
        getAccountsResult.innerHTML = accounts[0] || 'Not able to get accounts';
    });

    function handleNewAccounts(newAccounts) {
        accounts = newAccounts
        accountsDiv.innerHTML = accounts
        updateButtons()
    }

    function handleNewChain(chainId) {
        chainIdDiv.innerHTML = chainId
    }

    function handleNewNetwork(networkId) {
        networkDiv.innerHTML = networkId
    }

    async function getNetworkAndChainId() {
        try {
            const chainId = await ethereum.request({
                method: 'eth_chainId',
            })
            handleNewChain(chainId)

            const networkId = await ethereum.request({
                method: 'net_version',
            })
            handleNewNetwork(networkId)
        } catch (err) {
            console.error(err)
        }
    }

    async function newAccountsUpdateFunction() {
        try {
            const newAccounts = await ethereum.request({
                method: 'eth_accounts',
            })
            handleNewAccounts(newAccounts)
        } catch (err) {
            console.error('Error on init when getting accounts', err)
        }
    }

    // transferToPolygonButton.addEventListener('click', async () => {
    //     polygonBridgeContractStatus.innerHTML = 'Transfer initiated'
    //     contract.transferToPolygon(
    //         {
    //             _tokenAmount: '1'
    //         },
    //         (result) => {
    //             console.log(result)
    //             polygonBridgeContractStatus.innerHTML = 'Transfer completed'
    //         },
    //     )
    // });

    MetaMaskClientCheck();
    updateButtons();

    if (isMetaMaskInstalled()) {

        ethereum.autoRefreshOnNetworkChange = false
        getNetworkAndChainId()

        ethereum.on('chainChanged', handleNewChain)
        ethereum.on('networkChanged', handleNewNetwork)
        ethereum.on('accountsChanged', handleNewAccounts)

        newAccountsUpdateFunction();
    }

    /// --------------------------------------------------------------------------------------------------
    /// Ethereum Bridge buttons
    /// --------------------------------------------------------------------------------------------------

    async function readABIEthereumBridgeContract() {
        try {
            return fetch('./contractsABI/ABIEthereumBridgeContract.json')
            .then(response => {
                if (!response.ok) {
                    throw new FetchError(response);
                }
                return response.json();
            });
        } catch (err) {
            console.error('Error', err)
        }
    }

    async function instanciateEthereumBridgeContract() {
        try {
            web3 = new window.Web3(window.ethereum);
            ethereumBridgeABI = await readABIEthereumBridgeContract();
            contractEthereumBridgeInstance = await new web3.eth.Contract(ethereumBridgeABI, contractAddressEthereum.value);
            console.log(contractEthereumBridgeInstance);
        } catch (err) {
            console.error('Error', err)
        }
    }    

    instanciateEthereumBridgeContractButton.addEventListener('click', async () => {
        try {
            ethereumBridgeContractStatus.innerHTML = 'Initi instanciate'
            await instanciateEthereumBridgeContract();
            ethereumBridgeContractStatus.innerHTML = 'Instanciate complete'
        } catch (err) {
            ethereumBridgeContractStatus.innerHTML = 'Error on instanciating'
        }
    });

    transferToPolygonButton.addEventListener('click', async () => {
        try {
            ethereumBridgeContractStatus.innerHTML = 'Initi transfer';
            const tx1 = await contractEthereumBridgeInstance.methods.transferToPolygon(10).send({from: window.ethereum.selectedAddress});
            ethereumBridgeContractStatus.innerHTML = 'Transfer complete' + tx1;
        } catch (err) {
            ethereumBridgeContractStatus.innerHTML = 'Error on transfer' + err.message
        }
    });

    /// --------------------------------------------------------------------------------------------------
    /// Polygon Bridge buttons
    /// --------------------------------------------------------------------------------------------------

    async function readABIPolygonBridgeContract() {
        try {
            return fetch('./contractsABI/ABIPolygonBridgeContract.json')
            .then(response => {
                if (!response.ok) {
                    throw new FetchError(response);
                }
                return response.json();
            });
        } catch (err) {
            console.error('Error', err)
        }
    }

    async function instanciatePolygonBridgeContract() {
        try {
            web3 = new window.Web3(window.ethereum);
            polygonBridgeABI = await readABIPolygonBridgeContract();
            contractPolygonBridgeInstance = await new web3.eth.Contract(polygonBridgeABI, contractAddressPolygon);
        } catch (err) {
            console.error('Error ', err)
        }
    }
    
    instanciatePolygonBridgeContractButton.addEventListener('click', async () => {
        try {
            polygonBridgeContractStatus.innerHTML = 'Initi instanciate'
            await instanciatePolygonBridgeContract();
            polygonBridgeContractStatus.innerHTML = 'Instanciate complete'
        } catch (err) {
            polygonBridgeContractStatus.innerHTML = 'Error on instanciating'
        }
    });

    // tokenStakingButton.addEventListener('click', async () => {
    //     try {
    //         ethereumBridgeContractStatus.innerHTML = 'Initi transfer';
    //         //transferir desde el signer 10 tokens al account 3
    //         const tx = await newContractInstance.approve(ethereumBridgeContractInstance.address, transferAmount);
    //         const tx1 = await contractEthereumBridgeInstance.methods.transferToPolygon(10).send({from: window.ethereum.selectedAddress});
    //         ethereumBridgeContractStatus.innerHTML = 'Transfer complete' + tx;
    //     } catch (err) {
    //         ethereumBridgeContractStatus.innerHTML = 'Error on transfer' + err.message
    //     }
    // });

    /// --------------------------------------------------------------------------------------------------
    /// ERC-20 buttons
    /// --------------------------------------------------------------------------------------------------

    async function readABIERC20EthereumContract() {
        try {
            return fetch('./contractsABI/ABIERC20EthereumContract.json')
            .then(response => {
                if (!response.ok) {
                    throw new FetchError(response);
                }
                return response.json();
            });
        } catch (err) {
            console.error('Error', err)
        }
    }
    
    async function instanciateERC20EthereumContract() {
        try {
            web3 = new window.Web3(window.ethereum);
            ethereumERC20ABI = await readABIERC20EthereumContract();
            contractERC20EthereumInstance = await new web3.eth.Contract(ethereumERC20ABI, contractAddressERC20Ethereum.value);
            console.log(contractERC20EthereumInstance);
        } catch (err) {
            console.error('Error', err)
        }
    }
  
    instanciateERC20EthereumContractButton.addEventListener('click', async () => {
        try {
            erc20EthereumContractStatus.innerHTML = 'Initi instanciate'
            await instanciateERC20EthereumContract();
            erc20EthereumContractStatus.innerHTML = 'Instanciate complete'
        } catch (err) {
            erc20EthereumContractStatus.innerHTML = 'Error on instanciating'
        }
    });
    
    approveERC20EthButton.addEventListener('click', async () => {
        try {
            erc20EthereumContractStatus.innerHTML = 'Init approve';
            const tx1 = await contractERC20EthereumInstance.methods.approve(window.ethereum.selectedAddress, 10).send({from: window.ethereum.selectedAddress});
            erc20EthereumContractStatus.innerHTML = 'Approve complete' + tx;
        } catch (err) {
            erc20EthereumContractStatus.innerHTML = 'Error on approve' + err.message
        }
    });

    transferERC20ETHButton.addEventListener('click', async () => {
        try {
            erc20EthereumContractStatus.innerHTML = 'Init transfer';
            const tx1 = await contractERC20EthereumInstance.methods.transfer(window.ethereum.selectedAddress, 10).send({from: window.ethereum.selectedAddress});
            erc20EthereumContractStatus.innerHTML = 'Transfer complete' + tx;
        } catch (err) {
            erc20EthereumContractStatus.innerHTML = 'Error on transfer' + err.message
        }
    });
};

window.addEventListener('DOMContentLoaded', initialize);