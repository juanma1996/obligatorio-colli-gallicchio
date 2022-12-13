[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-c66648af7eb3fe8bc4f294546bfd86ef473780cde1dea487d3c4ff354943c9ae.svg)](https://classroom.github.com/online_ide?assignment_repo_id=9214956&assignment_repo_type=AssignmentRepo)
# Bridge-Template

## Setup

1. Clonar el repositorio

2. Complete sus datos:
  * NUMERO DE ESTUDIANTE 1: 136382
  * NOMBRE DE ESTUDIANTE: CARLOS COLLI
  * ADDRESS DE CUENTA ESTUDIANTE 1: 0x397C2cc359f9318E802aF7cd5545117175190d80

  * NUMERO DE ESTUDIANTE 2: 136382 
  * NOMBRE DE ESTUDIANTE 2: JUAN MANUEL GALLICHIO
  * ADDRESS DE CUENTA ESTUDIANTE 2: 0x8fB32163b178984e8f1b204f5527DE8A9D1bEBB8

  * ADDRESS DEL Exchange EN GOERLI: 0x3eCF8756979420b9c498633643322FFa679c8599
  * ADDRESS DEL ERC20_Ethereum EN GOERLI: 0x8d322fAD9D23c2d9a7BF84938D60C4a28aA43C82
  * ADDRESS DEL Bridge_Ethereum EN GOERLI: 0x4E474117523787b0d56E6FC69494DD4d06F0d64d

  * ADDRESS DEL ERC20_Polygon EN MUMBAI: 0x353A391b423a738a1d6B7A3c8503e8F180708dFD
  * ADDRESS DEL Bridge_Polygon EN MUMBAI: 0x91EfAcbBa055ee31C3cecCE4D99428888689bDaA

3. Installar hardhat `npm install hardhat --save-dev`

4. Instalar dependencias `npm install`

5. Complete la información del archivo `.env` en el directorio raiz de la carpeta. Si no utilizará Ganache para sus pruebas quitelo de la configuración.

6. Configure el archivo `hardhat.config.js` según sus necesidades

## Task

Se desea crear un ecosistema financiero basado en blockchain, donde los usuarios puedan comprar y vender token fungibles a cambio de ethers e intercambiarlos entre las redes blockchain de Ethereum y Polygon.

Para esto se requiere el desarrollo de un token fungible que siga el estándar ERC-20 visto en el curso. Además, se deberá desarrollar un Exchange para poder comprar y vender el token fungible y un Bridge para poder interactuar con las redes blockchain mencionadas.

El ecosistema debe poder ser integrado a las DApps de la red de Ethereum y a las DApps de la red de Polygon, por lo que será necesario manejar un bridge (puente) entre ambas redes para poder negocios activos en ambos ecosistemas por medio del token fungible de cada ecosistema.

Las interfaces operativas de algunas de las plataformas le serán definidas por el profesor de la materia, por lo que deberá implementar dichas interfaces en sus contratos inteligentes, así como diseñar e implementar todos los contratos y método auxiliares que sean necesarios.
Debe trabajar de forma flexible, de forma de poder afrontar cambios repentinos en los requerimientos del sistema.

Utilice para todos sus comentarios la nomenclatura definida por ´Ethereum Natural Language Specification Format´ (´natspec´). Referencia: https://docs.soliditylang.org/en/v0.8.16/natspec-format.html

Complete el script de deploy `deploy.js` ubicado en la carpeta 'scripts' y deploye el contrato a la red Goerli.
Complete el script de test `contract.test.js` ubicado en la carpeta 'test'.

Ejecute sus tests con el comando: `npx hardhat test`.

## **IMPORTANTE** Suba sus cambios al repositorio

1. Publicar cambios a su repositorio

`git add .`  
`git commit -m "<<your comments here>>"`  
`git push origin main`

## Componentes del proyecto

  * ## CONTRATOS ##
  * TokenAbstract
  * ERC20_Ethereum
  * ERC20_Polygon
  * BridgeAbstract
  * Bridge_Ethereum
  * Bridge_Polygon
  * Exchange

  ## DIAGRAMA ##


  ## ITERACIÓN ##  


## Deploy en GOERLI

1. Configurar archivo `hardhat.config.js`
   Se debe configurar la red goerli.
  
2. Modificar valores de archivo `.env`
  * En este archivo se encuentran las Account y Private Keys necesarias para deployar en red Goerli.
    Para el Deploy se necesita contar con 2 Account, una que auspicia de "OWNER" (GOERLI_ACCOUNTOWNER) y otra que auspicia de TOKEN VAULT (GOERLI_TOKENVAULT) en el Exchange.
    NOTA: El OWNER de los contratos será siempre el mismo en este escenario.
    
    * GOERLI_ACCESSPOINT_URL = 
    * GOERLI_ACCOUNTOWNER = 
    * GOERLI_PRIVATE_OWNER = 
    * GOERLI_TOKENVAULT = 
    * GOERLI_PRIVATE_TOKENVAULT = 

3. Ejecutar comando `npx hardhat run scripts\deploy_Ethereum.js --network goerli`

## Deploy en MUMBAI

1. Configurar archivo `hardhat.config.js`
   Se debe configurar la red mumbai.
  
2. Modificar valores de archivo `.env`
  * En este archivo se encuentran las Account y Private Keys necesarias para deployar en red Mumbai.
    Para el Deploy se necesita contar con 1 Account que auspicia de "OWNER" (MUMBAI_ACCOUNTOWNER).
    NOTA: El OWNER de los contratos será siempre el mismo en este escenario.
    
    * MUMBAI_ACCESSPOINT_URL = 
    * MUMBAI_ACCOUNTOWNER = 
    * MUMBAI_PRIVATE_OWNER = 

3. Ejecutar comando `npx hardhat run scripts\deploy_Ethereum.js --network mumbai`

## Deploy en Ganache

1. Configurar archivo `hardhat.config.js`
   Se debe configurar la red mumbai.
  
2. Modificar valores de archivo `.env`
  * En este archivo se encuentran las Account y Private Keys necesarias para deployar en red Ganache.
    Para el Deploy se necesita contar con 7 cuentas, 1 CUENTA OWNER, 2 CUENTAS TOKEN VAULT, 4 CUENTAS CLIENTES
    
      * GANACHE_URL = 
      * GANACHE_ACCOUNT = 
      * GANACHE_PRIVATE_KEY = 
      * GANACHE_ACCOUNT2 = 
      * GANACHE_PRIVATE_KEY2 = 
      * GANACHE_ACCOUNT3 = 
      * GANACHE_PRIVATE_KEY3 = 
      * GANACHE_ACCOUNT4 =
      * GANACHE_PRIVATE_KEY4 = 
      * GANACHE_ACCOUNT5 = 
      * GANACHE_PRIVATE_KEY5 = 
      * GANACHE_ACCOUNT6 =
      * GANACHE_PRIVATE_KEY6 = 
      * GANACHE_ACCOUNT7 = 
      * GANACHE_PRIVATE_KEY7 = 

3. Ejecutar comando `npx hardhat run scripts\deploy.js --network ganache`
4. Todos los contratos se deployarán en la misma red

## Tests en HARDHAT o GANACHE

  * Para ejecutar las pruebas en red HARDHAT, ejecutar comando `npx hardhat test`
  * Para ejecutar las pruebas en red GANACHE se debe modificar archivo `hardhat.config.js`, descomentando las líneas que hacen referencia a la red GANACHE
  * Configurar el archivo `.env` con 7 cuentas, 1 CUENTA OWNER, 2 CUENTAS TOKEN VAULT, 4 CUENTAS CLIENTES
  
      * GANACHE_ACCOUNT = 
      * GANACHE_PRIVATE_KEY = 
      * GANACHE_ACCOUNT2 = 
      * GANACHE_PRIVATE_KEY2 = 
      * GANACHE_ACCOUNT3 = 
      * GANACHE_PRIVATE_KEY3 = 
      * GANACHE_ACCOUNT4 =
      * GANACHE_PRIVATE_KEY4 = 
      * GANACHE_ACCOUNT5 = 
      * GANACHE_PRIVATE_KEY5 = 
      * GANACHE_ACCOUNT6 =
      * GANACHE_PRIVATE_KEY6 = 
      * GANACHE_ACCOUNT7 = 
      * GANACHE_PRIVATE_KEY7 = 
