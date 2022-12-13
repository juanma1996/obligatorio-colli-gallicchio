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
    const addressToEthereumBridge = document.getElementById('addressToEthereumBridge');
    const ethereumEvents = document.getElementById('ethereumEvents');

    //ERC-20 Ethereum Contract Section
    const contractAddressERC20Ethereum = document.getElementById('erc20EthereumAddress');
    const approveERC20EthButton = document.getElementById('btnApproveERC20Eth');
    const transferERC20ETHButton = document.getElementById('btnTransferERC20Eth');
    const instanciateERC20EthereumContractButton = document.getElementById('btnInstanciateERC20EthereumContract');
    const addressToERC20Ethereum = document.getElementById('addressToErc20Ethereum');
    const balanceERC20EthereumButton = document.getElementById('btnBalanceERC20Ethereum');
    const erc20EthereumBalanceOf = document.getElementById('erc20EthereumBalanceOf');
    


    //ERC-20 Polygon Contract Section
    const contractAddressERC20Polygon = document.getElementById('erc20PolygonAddress');
    const approveERC20PolygonButton = document.getElementById('btnApproveERC20Polygon');
    const instanciateERC20PolygonContractButton = document.getElementById('btnInstanciateERC20PolygonContract');
    const addressToERC20Polygon = document.getElementById('addressToErc20Polygon');
    const balanceERC20PolygonButton = document.getElementById('btnBalanceERC20Polygon');
    const erc20PolygonBalanceOf = document.getElementById('erc20PolygonBalanceOf');

    //Polygon Bridge Contract Section
    const contractAddressPolygon = document.getElementById('polygonBridgeAddress');
    const mintToButton = document.getElementById('btnMintTo');
    const transferToEthereumButton = document.getElementById('btnTransferToEthereum');
    const instanciatePolygonBridgeContractButton = document.getElementById('btnInstanciatePolygonBridgeContract');
    const polygonEvents = document.getElementById('polygonEvents');

    //Exchange Contract Section
    const contractAddressExchange = document.getElementById('exchangeAddress');
    const getExchangeRateButton = document.getElementById('btnGetExchangeRate');
    const calculateEtherAmountButton = document.getElementById('btnCalculateEtherAmount');
    const instanciateExchangeContractButton = document.getElementById('btnInstanciateExchangeContract');
    const exchangeContractResult = document.getElementById('exchangeContractResult');
    const getInvariantButton = document.getElementById('btnInvariant');
    
    let accounts
    let contractEthereumBridgeInstance
    let contractERC20EthereumInstance
    let contractPolygonBridgeInstance
    let contractERC20PolygonInstance
    let contractExchangeInstance
    let polygonBridgeABI
    let ethereumBridgeABI
    let polygonERC20ABI
    let ethereumERC20ABI
    let exchangeABI
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
            const tx1 = await contractEthereumBridgeInstance.methods.transferToPolygon(amountBridgeEthereum.value).send({ from: window.ethereum.selectedAddress });
            let information = '\ntransactionHash: ' + tx1.transactionHash;
            information += '\nblockHash ' + tx1.blockHash;
            information += '\nfrom: ' + tx1.from;
            information += '\nto: ' + tx1.to;
            information += '\ngasUsed: ' + tx1.gasUsed;
            ethereumEvents.innerHTML = information;
            ethereumBridgeContractStatus.innerHTML = 'Transfer complete';
        } catch (err) {
            ethereumBridgeContractStatus.innerHTML = 'Error on transfer' + err.message
        }
    });

    async function getEvents() {
        let latest_block = await web3.eth.getBlockNumber();
        let historical_block = latest_block - 10000; // you can also change the value to 'latest' if you have a upgraded rpc
        const events = await contractPolygonBridgeInstance.getPastEvents(
            'TransferToEthereum',
            { fromBlock: historical_block, toBlock: 'latest' }
        );
        return await getTransferDetails(events);
    };

    async function getTransferDetails(data_events) {
        let to = data_events[data_events.length - 1]['returnValues']['_to'];
        let _tokenAmount = data_events[data_events.length - 1]['returnValues']['_tokenAmount'];
        return { to, _tokenAmount };
    };

    unstakeButton.addEventListener('click', async () => {
        try {
            ethereumBridgeContractStatus.innerHTML = 'Initi unstake call';
            let data = await getEvents();
            const tx1 = await contractEthereumBridgeInstance.methods.unStake(data.to, data._tokenAmount).send({ from: window.ethereum.selectedAddress });
            let information = '\ntransactionHash: ' + tx1.transactionHash;
            information += '\nblockHash ' + tx1.blockHash;
            information += '\nfrom: ' + tx1.from;
            information += '\nto: ' + tx1.to;
            information += '\ngasUsed: ' + tx1.gasUsed;
            ethereumEvents.innerHTML = information;
            ethereumBridgeContractStatus.innerHTML = 'Unstake call complete.';
        } catch (err) {
            ethereumBridgeContractStatus.innerHTML = 'Error on unstake call' + err.message
        }
    });

    tokenStakingButton.addEventListener('click', async () => {
        try {
            ethereumBridgeContractStatus.innerHTML = 'Initi token staking call';
            const tx1 = await contractEthereumBridgeInstance.methods.tokenStaking(addressToEthereumBridge.value).call();
            ethereumBridgeContractStatus.innerHTML = 'Token staking call complete. Result: ' + tx1;
        } catch (err) {
            ethereumBridgeContractStatus.innerHTML = 'Error on token staking call' + err.message
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
            contractPolygonBridgeInstance = await new web3.eth.Contract(polygonBridgeABI, contractAddressPolygon.value);
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

    transferToEthereumButton.addEventListener('click', async () => {
        try {
            polygonBridgeContractStatus.innerHTML = 'Initi transfer to ethereum call';
            const tx1 = await contractPolygonBridgeInstance.methods.transferToEthereum(amountBridgePolygon.value).send({ from: window.ethereum.selectedAddress });
            let information = 'transactionHash: ' + tx1.transactionHash;
            information += '\nblockHash ' + tx1.blockHash;
            information += '\nfrom: ' + tx1.from;
            information += '\nto: ' + tx1.to;
            information += '\ngasUsed: ' + tx1.gasUsed;
            polygonEvents.innerHTML = information;
            polygonBridgeContractStatus.innerHTML = 'Transfer to ethereum call complete.';
        } catch (err) {
            polygonBridgeContractStatus.innerHTML = 'Error on token staking call' + err.message
        }
    });

    async function getEventsMint() {
        let latest_block = await web3.eth.getBlockNumber();
        let historical_block = latest_block - 10000; // you can also change the value to 'latest' if you have a upgraded rpc
        console.log("latest: ", latest_block, "historical block: ", historical_block);
        const events = await contractEthereumBridgeInstance.getPastEvents(
            'TransferToPolygon',
            { fromBlock: historical_block, toBlock: 'latest' }
        );
        return await getTransferDetailsMint(events);
    };

    async function getTransferDetailsMint(data_events) {
        let _from = data_events[data_events.length - 1]['returnValues']['_from'];
        let _tokenAmount = data_events[data_events.length - 1]['returnValues']['_tokenAmount'];
        return { _from, _tokenAmount }
    };

    mintToButton.addEventListener('click', async () => {
        try {
            polygonBridgeContractStatus.innerHTML = 'Initi mint to call';
            let data = await getEventsMint();
            const tx1 = await contractPolygonBridgeInstance.methods.mintTo(data._from, data._tokenAmount).send({ from: window.ethereum.selectedAddress });
            let information = 'transactionHash: ' + tx1.transactionHash;
            information += '\nblockHash ' + tx1.blockHash;
            information += '\nfrom: ' + tx1.from;
            information += '\nto: ' + tx1.to;
            information += '\ngasUsed: ' + tx1.gasUsed;
            polygonEvents.innerHTML = information;
            polygonBridgeContractStatus.innerHTML = 'Mint to call complete.';
        } catch (err) {
            polygonBridgeContractStatus.innerHTML = 'Error on mint to call' + err.message
        }
    });

    /// --------------------------------------------------------------------------------------------------
    /// ERC-20 Ethereum buttons
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
            const tx1 = await contractERC20EthereumInstance.methods.approve(addressToERC20Ethereum.value, amountERC20Ethereum.value).send({ from: window.ethereum.selectedAddress });
            let information = 'transactionHash: ' + tx1.transactionHash;
            information += '\nblockHash ' + tx1.blockHash;
            information += '\nfrom: ' + tx1.from;
            information += '\nto: ' + tx1.to;
            information += '\ngasUsed: ' + tx1.gasUsed;
            ethereumEvents.innerHTML = information;
            erc20EthereumContractStatus.innerHTML = 'Approve complete';
        } catch (err) {
            erc20EthereumContractStatus.innerHTML = 'Error on approve' + err.message
        }
    });

    transferERC20ETHButton.addEventListener('click', async () => {
        try {
            erc20EthereumContractStatus.innerHTML = 'Init transfer';
            const tx1 = await contractERC20EthereumInstance.methods.transfer(addressToERC20Ethereum.value, amountERC20Ethereum.value).send({ from: window.ethereum.selectedAddress });
            let information = 'transactionHash: ' + tx1.transactionHash;
            information += '\nblockHash ' + tx1.blockHash;
            information += '\nfrom: ' + tx1.from;
            information += '\nto: ' + tx1.to;
            information += '\ngasUsed: ' + tx1.gasUsed;
            ethereumEvents.innerHTML = information;
            erc20EthereumContractStatus.innerHTML = 'Transfer complete';
        } catch (err) {
            erc20EthereumContractStatus.innerHTML = 'Error on transfer' + err.message
        }
    });

    balanceERC20EthereumButton.addEventListener('click', async () => {
        try {
            erc20EthereumContractStatus.innerHTML = 'Init call balance of';
            const tx1 = await contractERC20EthereumInstance.methods.balanceOf(addressToErc20Ethereum.value).call();
            erc20EthereumBalanceOf.innerHTML = tx1;;
            erc20EthereumContractStatus.innerHTML = 'Call balance of complete' + tx1;
        } catch (err) {
            erc20EthereumContractStatus.innerHTML = 'Error on call balance of' + err.message
        }
    });

    /// --------------------------------------------------------------------------------------------------
    /// ERC-20 Polygon buttons
    /// --------------------------------------------------------------------------------------------------

    async function readABIERC20PolygonContract() {
        try {
            return fetch('./contractsABI/ABIERC20PolygonContract.json')
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

    async function instanciateERC20PolygonContract() {
        try {
            web3 = new window.Web3(window.ethereum);
            polygonERC20ABI = await readABIERC20PolygonContract();
            contractERC20PolygonInstance = await new web3.eth.Contract(polygonERC20ABI, contractAddressERC20Polygon.value);
        } catch (err) {
            console.error('Error', err)
        }
    }

    instanciateERC20PolygonContractButton.addEventListener('click', async () => {
        try {
            erc20PolygonContractStatus.innerHTML = 'Initi instanciate'
            await instanciateERC20PolygonContract();
            erc20PolygonContractStatus.innerHTML = 'Instanciate complete'
        } catch (err) {
            erc20PolygonContractStatus.innerHTML = 'Error on instanciating'
        }
    });

    approveERC20PolygonButton.addEventListener('click', async () => {
        try {
            erc20PolygonContractStatus.innerHTML = 'Init approve';
            const tx1 = await contractERC20PolygonInstance.methods.approve(addressToERC20Polygon.value, amountERC20Polygon.value).send({ from: window.ethereum.selectedAddress });
            let information = 'transactionHash: ' + tx1.transactionHash;
            information += '\nblockHash ' + tx1.blockHash;
            information += '\nfrom: ' + tx1.from;
            information += '\nto: ' + tx1.to;
            information += '\ngasUsed: ' + tx1.gasUsed;
            polygonEvents.innerHTML = information;
            erc20PolygonContractStatus.innerHTML = 'Approve complete';
        } catch (err) {
            erc20PolygonContractStatus.innerHTML = 'Error on approve' + err.message
        }
    });

    balanceERC20PolygonButton.addEventListener('click', async () => {
        try {
            erc20PolygonContractStatus.innerHTML = 'Init call balance of';
            const tx1 = await contractERC20PolygonInstance.methods.balanceOf(addressToERC20Polygon.value).call();
            erc20PolygonBalanceOf.innerHTML = tx1;
            erc20PolygonContractStatus.innerHTML = 'Call balance of complete ' + tx1;
        } catch (err) {
            erc20PolygonContractStatus.innerHTML = 'Error on call balance of' + err.message
        }
    });

    /// --------------------------------------------------------------------------------------------------
    /// Exchange buttons
    /// --------------------------------------------------------------------------------------------------

    async function readABIExchangeContract() {
        try {
            return fetch('./contractsABI/ABIExchange.json')
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

    async function instanciateExchangeContract() {
        try {
            web3 = new window.Web3(window.ethereum);
            exchangeABI = await readABIExchangeContract();
            contractExchangeInstance = await new web3.eth.Contract(exchangeABI, contractAddressExchange.value);
        } catch (err) {
            console.error('Error', err)
        }
    }

    instanciateExchangeContractButton.addEventListener('click', async () => {
        try {
            exchangeContractStatus.innerHTML = 'Initi instanciate'
            await instanciateExchangeContract();
            exchangeContractStatus.innerHTML = 'Instanciate complete'
        } catch (err) {
            exchangeContractStatus.innerHTML = 'Error on instanciating'
        }
    });

    getExchangeRateButton.addEventListener('click', async () => {
        try {
            exchangeContractStatus.innerHTML = 'Init call get exchange rate';
            const tx1 = await contractExchangeInstance.methods.getExchangeRate().call();
            exchangeContractResult.innerHTML = web3.utils.fromWei(tx1);
            exchangeContractStatus.innerHTML = 'Call get exchange rate complete ' + tx1;
        } catch (err) {
            exchangeContractStatus.innerHTML = 'Error on get exchange rate' + err.message
        }
    });

    calculateEtherAmountButton.addEventListener('click', async () => {
        try {
            exchangeContractStatus.innerHTML = 'Init call calculate ether amount';
            const tx1 = await contractExchangeInstance.methods.calculateEtherAmount(amountExchange.value).call();
            exchangeContractResult.innerHTML = web3.utils.fromWei(tx1);
            exchangeContractStatus.innerHTML = 'Call calculate ether amount complete ' + tx1;
        } catch (err) {
            exchangeContractStatus.innerHTML = 'Error on calculate ether amount' + err.message
        }
    });

    getInvariantButton.addEventListener('click', async () => {
        try {
            exchangeContractStatus.innerHTML = 'Init call get invariant';
            const tx1 = await contractExchangeInstance.methods.invariant().call();
            exchangeContractResult.innerHTML = web3.utils.fromWei(tx1);
            exchangeContractStatus.innerHTML = 'Call get invariant complete ' + tx1;
        } catch (err) {
            exchangeContractStatus.innerHTML = 'Error on get invariant' + err.message
        }
    });
};

window.addEventListener('DOMContentLoaded', initialize);