"use client";

import {
  createWalletClient,
  custom,
  type Address,
  type EIP1193Provider,
  type WalletClient,
} from "viem";
import { polygon } from "viem/chains";

import { CHAIN_ID } from "../config.ts";

/**
 * Wallet plumbing. Everything here runs in the browser and the private key
 * never leaves it — the server only ever sees an already-signed order.
 */

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

export interface Connection {
  address: Address;
  walletClient: WalletClient;
}

export function hasInjectedWallet(): boolean {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
}

/** Prompt to connect, then make sure we're on Polygon. */
export async function connect(): Promise<Connection> {
  const provider = window.ethereum;
  if (!provider) {
    throw new Error("No browser wallet found. Install MetaMask (or similar) to play for real.");
  }

  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as Address[];
  const address = accounts?.[0];
  if (!address) throw new Error("Wallet connection was rejected.");

  await ensurePolygon(provider);

  const walletClient = createWalletClient({
    account: address,
    chain: polygon,
    transport: custom(provider),
  });

  return { address, walletClient };
}

/** Switch to Polygon, adding the network first if the wallet doesn't know it. */
async function ensurePolygon(provider: EIP1193Provider): Promise<void> {
  const target = `0x${CHAIN_ID.toString(16)}`;
  const current = (await provider.request({ method: "eth_chainId" })) as string;
  if (current?.toLowerCase() === target) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: target as `0x${string}` }],
    });
  } catch (err) {
    // 4902 = chain unknown to the wallet, so offer to add it.
    if ((err as { code?: number })?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: target,
            chainName: "Polygon",
            nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
            rpcUrls: ["https://polygon-rpc.com"],
            blockExplorerUrls: ["https://polygonscan.com"],
          },
        ],
        // viem's types don't model wallet_addEthereumChain's params precisely.
      } as never);
      return;
    }
    throw new Error("Switch your wallet to the Polygon network to trade.");
  }
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
