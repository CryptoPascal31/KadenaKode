import { createSlice } from "@reduxjs/toolkit";
import { local } from "../../kda-wallet/store/kadenaSlice";

export const localTxSlice = createSlice({
  name: 'localTx',
  initialState: {
    txs: {}
  },
  reducers: {
    setLocalTxs: (state, action) => {
      state.txs = action.payload;
    },
    setLocalTxForChain: (state, action) => {
      state.txs[action.payload.chain] = action.payload.tx;
    }
  },
})

export const { 
  setLocalTx, setLocalTxForChain
} = localTxSlice.actions;

export const updateLocal = (sign = false) => {
  return async function(dispatch, getState) {
    let metaInfo = getState().metaInfo;
    const { code, envData, caps, gasLimit, gasPrice, chainIds } = metaInfo;
    let capsList = Object.values(caps);

    // console.log(capsList);
    var messages = {};
    for (var chainId of chainIds) {
      messages[chainId] = { message: "Loading Tx" };
    }
    dispatch(localTxSlice.actions.setLocalTxs(messages));
    
    for (var chainId of chainIds) {
      // console.log(chainId);
      let res = await dispatch(local(chainId, code, envData, capsList, gasLimit, gasPrice, true, sign));
      if (res) {
        dispatch(localTxSlice.actions.setLocalTxForChain({
          chain: chainId,
          tx: res,
        }));
      }
    }
  }
}

export default localTxSlice.reducer;