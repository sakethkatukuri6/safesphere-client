import * as Network from 'expo-network';
import { NetworkQuality } from './contract.types';

export async function getNetworkQuality(): Promise<NetworkQuality> {
  try {
    const state = await Network.getNetworkStateAsync();

    if (!state.isConnected || state.isInternetReachable === false) {
      return 'OFFLINE';
    }

    if (state.type === Network.NetworkStateType.WIFI || state.type === Network.NetworkStateType.ETHERNET) {
      return 'STRONG';
    }

    if (state.type === Network.NetworkStateType.CELLULAR) {
      // Cellular can be strong or weak depending on reachability or configuration
      return 'STRONG';
    }

    return 'WEAK';
  } catch {
    return 'WEAK';
  }
}
