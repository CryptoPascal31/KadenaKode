import { createSlice } from '@reduxjs/toolkit'
import TitleMessageRender from '../../components/TitleMessageRender';
import { createSigningCommand, listen, localCommand, sendCommand } from '../utils/utils';
import { hideModal } from './modalSlice';

export const kadenaSlice = createSlice({
  name: 'kadenaInfo',
  initialState: {
    network: 'https://api.testnet.chainweb.com',
    networkId: 'testnet04',
    ttl: 600,
    provider: {},
    account: '',
    pubKey: '',
    transactions: [],
    newTransaction: {},
    messages: [],
    newMessage: {},
  },
  reducers: {
    setNetwork: (state, action) => {
      state.network = action.payload;
    },
    setNetworkId: (state, action) => {
      state.networkId = action.payload;
    },
    setProvider: (state, action) => {
      state.provider = action.payload;
    },
    setAccount: (state, action) => {
      state.account = action.payload;
    },
    setPubKey: (state, action) => {
      state.pubKey = action.payload;
    },
    setTransactions: (state, action) => {
      state.transactions = action.payload;
    },
    addTransaction: (state, action) => {
      state.transactions.push(action.payload);
      state.newTransaction = action.payload;
    },
    setNewTransaction: (state, action) => {
      state.newTransaction = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
      state.newMessage = action.payload;
    },
    setNewMessage: (state, action) => {
      state.newMessage = action.payload;
    },
  },
})

export const { 
  setNetwork, setNetworkId, setAccount, setPubKey, 
  addTransaction, setNewTransaction 
} = kadenaSlice.actions;

export default kadenaSlice.reducer;


export const connectWithProvider = (provider) => {
  return async function(dispatch, getState) {
    let connectResult = await provider.connect(getState);
    console.log(connectResult);

    if (connectResult.status === 'success') {
      dispatch(kadenaSlice.actions.setProvider(provider));
      dispatch(kadenaSlice.actions.setAccount(connectResult.account.account));
      dispatch(kadenaSlice.actions.setPubKey(connectResult.account.publicKey));
      dispatch(hideModal());
    }
    else {
      dispatch(kadenaSlice.actions.addMessage({
        type: 'error',
        data: `Error: ${connectResult.message}. Make sure you are on ${getState().kadenaInfo.networkId}`,
      }));
      // toast.error(`Error: ${connectResult.message}. Make sure you are on ${getState().kadenaInfo.networkId}`); 
    }
  }
}

export const disconnectProvider = () => {
  return async function(dispatch, getState) {
    let provider = getState().kadenaInfo.provider;
    let disconnectResult = await provider.disconnect(getState);

    if (disconnectResult.status === 'success') {
      dispatch(kadenaSlice.actions.setAccount(""));
      dispatch(kadenaSlice.actions.setAccount(""));
      dispatch(kadenaSlice.actions.setPubKey(""));
    }
    else {
      dispatch(kadenaSlice.actions.addMessage({
        type: 'error',
        data: `Error: ${connectResult.message}. Make sure you are on ${getState().kadenaInfo.networkId}`,
      }));
      // toast.error(`Error: ${disconnectResult.message}\nMake sure you are on: ${getState().kadenaInfo.networkId}`);
    }
  }
}

export const local = (chainId, pactCode, envData, caps=[], gasLimit=15000, gasPrice=1e-5) => {
  return async function(dispatch, getState) {
    try {
      let res = await localCommand(getState, chainId, pactCode, envData, gasLimit, gasPrice);
      dispatch(kadenaSlice.actions.addTransaction(res));
    }
    catch (e) {
      dispatch(kadenaSlice.actions.addMessage({
        type: 'error',
        data: `${e}`,
      }));
    }
  }
}

export const signAndSend = (chainId, pactCode, envData, 
  caps=[], gasLimit=15000, gasPrice=1e-5) => {
  return async function sign(dispatch, getState) {
    try {
      let provider = getState().kadenaInfo.provider;
      let signingCmd = createSigningCommand(
        getState, 
        chainId, 
        pactCode, 
        envData, 
        caps, 
        gasLimit, 
        gasPrice
      );
      // console.log(signingCmd);
      let signedCmd = await provider.sign(getState, signingCmd);
      // console.log(signedCmd);
      let res = await sendCommand(getState, chainId, signedCmd);
      // console.log(res);

      let reqKey = res.requestKeys[0];
      let reqListen = listen(getState, reqKey);
      let txData = {
        ...res,
        listenPromise: reqListen,
      };
      console.log("tx data");
      console.log(txData);
      dispatch(kadenaSlice.actions.addTransaction(txData));
    }
    catch (e) {
      dispatch(kadenaSlice.actions.addMessage({
        type: 'error',
        data: 'Failed to sign command',
      }));
      // toast.error('Failed to sign command');
    }
  };
}