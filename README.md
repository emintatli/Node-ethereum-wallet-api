# Node.js EVM compatible wallet API
### Features
->Transfer funds.
->Recieve funds.
->Wallet & user account creation.
->Import wallet (from private key).
->Send funds to another user (from username).
->Send funds to another wallet (from wallet address).
->Balance check.

### Tech Stack
->Web3.js
->Node.js
->Express.js
### Note
This app is runs on BSC testnet as default.You need to change it in main.js

### Example Calls

##### Register

Endpoint: /api/register
username : users username who wants to register
password: users password who wants to register
pin : 4 digit pin to secure token transfer ( decided by user while registering.)

Example Call : http://localhost:3002/api/register?username=asdas123&password=423423&pin=1234

    Responses:
    status: "User Registered" 
     err: "invalid details."
    err: "username already exists." 

##### Login
username : users username who wants to login
password: users password who wants to login

Example Call :  http://localhost:3002/api/login?username=asdas123&password=423423

    Response : 
    If login succeed : 
    { username: user.username, wallet: user.wallet, accessToken: user.accessToken }
    If not :
    err: "invalid details."

*You will use this access token as auth key.To handle transactions etc.*

##### Register With Private Key
This action is for users who they import their account while registering.
Private is needs to start with 0x this is important.The other things are same as normal register.

Example Call http://localhost:3002/api/registerWithPrivate?username=asdddd&password=423423&pin=1234&private=0xPRIVATE

     status: "User Registered"
    err: "invalid details." 
    err: "username already exists." 

##### User Balance
This action is for getting user balances.You need to specify token contract address to check.

    accessToken : This is the auth key you got while users logged in.
    tokenAddress : This is the contract address of the token that you want to check users balance.(Not users address you don’t need to specify users wallet address)

Example Call:
http://localhost:3002/api/checkUserBalance?accessToken=e64284bf7e7dcb39310c8b60a03362a44f179d3664cd5f1a004f6400f8fb45cb&tokenAddress=0x645261080467b653Fe3e0A98B393722FD313c863

##### Send Balance to Address


Pin : 4 digit user need to specify it.
Amount : as WEI (not 1 for 1 token).You need to check tokens decimals If the token have 18 decimals and you want to send 1 token you need to write 10^18 as amount.(18 decimals)
Token address: token contract address that you want to send.
Access Token : This is the auth key you got while users logged in

    Reponse : If it succeeds it will return the TX.
    err: "incorrect pin" 
    err: "user not found."

Example Call:
http://localhost:3002/api/sendBalanceToAddress?tokenAddress=0x645261080467b653Fe3e0A98B393722FD313c863&amount=100000000000&accessToken=e64284bf7e7dcb39310c8b60a03362a44f179d3664cd5f1a004f6400f8fb45cb&to=0x318a41870C948AFb035f7b75f532c5a617564E36&pin=1234


##### Send Balance to Another User with Username
All things are same as the previous one except you need to specify username not wallet.
Username : The username that you want to send tokens.

    Reponse : If it succeeds it will return the TX.
    err: "incorrect pin" 
    err: "user not found."

Example Call:
http://localhost:3002/api/sendBalanceToUser?tokenAddress=0x645261080467b653Fe3e0A98B393722FD313c863&amount=100000000000&accessToken=e64284bf7e7dcb39310c8b60a03362a44f179d3664cd5f1a004f6400f8fb45cb&toUser=deneme2&pin=1234








