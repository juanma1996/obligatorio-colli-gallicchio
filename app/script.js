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

    let accounts
    let accountButtonsInitialized = false

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
        } else if (isMetaMaskConnected()) {
            onboardButton.innerText = 'Connected'
            onboardButton.disabled = true
            if (onboarding) {
                onboarding.stopOnboarding()
            }
        } else {
            onboardButton.innerText = 'Connect'
            onboardButton.onclick = onClickConnect
            onboardButton.disabled = false
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
};

window.addEventListener('DOMContentLoaded', initialize);