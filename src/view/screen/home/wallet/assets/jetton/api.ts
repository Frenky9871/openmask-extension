import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { JettonState } from "../../../../../../libs/entries/asset";
import { TonWebTransaction } from "../../../../../../libs/entries/transaction";
import { QueryType } from "../../../../../../libs/store/browserStore";
import {
  AccountStateContext,
  NetworkContext,
  TonProviderContext,
} from "../../../../../context";
import { saveAccountState } from "../../../../api";

export const useJettonTransactions = (
  state: JettonState,
  limit: number = 10
) => {
  const network = useContext(NetworkContext);
  const ton = useContext(TonProviderContext);

  return useQuery<TonWebTransaction[], Error>(
    [network, state?.walletAddress, QueryType.transactions],
    () => ton.getTransactions(state?.walletAddress!, limit),
    { enabled: state?.walletAddress != null }
  );
};

export const useHideJettonMutation = () => {
  const network = useContext(NetworkContext);
  const account = useContext(AccountStateContext);
  const client = useQueryClient();
  return useMutation<void, Error, string>(
    async (jettonMinterAddress: string) => {
      const value = {
        ...account,
        wallets: account.wallets.map((wallet) => {
          if (wallet.address === account.activeWallet) {
            return {
              ...wallet,
              assets: (wallet.assets ?? []).filter(
                (asset) => asset.minterAddress !== jettonMinterAddress
              ),
            };
          }
          return wallet;
        }),
      };
      await saveAccountState(network, client, value);
    }
  );
};
