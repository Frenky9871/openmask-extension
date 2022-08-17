import { useMutation } from "@tanstack/react-query";
import { useContext } from "react";
import { AccountStateContext } from "../../context";
import { askBackground, sendBackground } from "../../event";
import { validateMnemonic } from "./account";

/**
 * @param plaintext {string}
 * @param password {string}
 * @return {Promise<string>}
 */
export async function encrypt(plaintext: string, password: string) {
  const pwUtf8 = new TextEncoder().encode(password); // encode password as UTF-8
  const pwHash = await crypto.subtle.digest("SHA-256", pwUtf8); // hash the password

  const iv = crypto.getRandomValues(new Uint8Array(12)); // get 96-bit random iv

  const alg = { name: "AES-GCM", iv: iv }; // specify algorithm to use

  const key = await crypto.subtle.importKey("raw", pwHash, alg, false, [
    "encrypt",
  ]); // generate key from pw

  const ptUint8 = new TextEncoder().encode(plaintext); // encode plaintext as UTF-8
  const ctBuffer = await crypto.subtle.encrypt(alg, key, ptUint8); // encrypt plaintext using key

  const ctArray = Array.from(new Uint8Array(ctBuffer)); // ciphertext as byte array
  const ctStr = ctArray.map((byte) => String.fromCharCode(byte)).join(""); // ciphertext as string
  const ctBase64 = btoa(ctStr); // encode ciphertext as base64

  const ivHex = Array.from(iv)
    .map((b) => ("00" + b.toString(16)).slice(-2))
    .join(""); // iv as hex string

  return ivHex + ctBase64; // return iv+ciphertext
}

/**
 * @param ciphertext {string}
 * @param password {string}
 * @return {Promise<string>}
 */
export async function decrypt(ciphertext: string, password: string) {
  const pwUtf8 = new TextEncoder().encode(password); // encode password as UTF-8
  const pwHash = await crypto.subtle.digest("SHA-256", pwUtf8); // hash the password

  const iv = ciphertext
    .slice(0, 24)
    .match(/.{2}/g)!
    .map((byte) => parseInt(byte, 16)); // get iv from ciphertext

  const alg = { name: "AES-GCM", iv: new Uint8Array(iv) }; // specify algorithm to use

  const key = await crypto.subtle.importKey("raw", pwHash, alg, false, [
    "decrypt",
  ]); // use pw to generate key

  const ctStr = atob(ciphertext.slice(24)); // decode base64 ciphertext
  const ctUint8 = new Uint8Array(
    ctStr.match(/[\s\S]/g)!.map((ch) => ch.charCodeAt(0))
  ); // ciphertext as Uint8Array
  // note: why doesn't ctUint8 = new TextEncoder().encode(ctStr) work?

  const plainBuffer = await crypto.subtle.decrypt(alg, key, ctUint8); // decrypt ciphertext using key
  const plaintext = new TextDecoder().decode(plainBuffer); // decode password from UTF-8

  return plaintext; // return the plaintext
}

export const askBackgroundPassword = async () => {
  const password = await askBackground<void>().message("getPassword");
  console.log({ password });
  if (password == null || password === "") {
    throw new Error("Unexpected password");
  }
  return password;
};

export const decryptMnemonic = async (mnemonic: string, password: string) => {
  const worlds = await decrypt(mnemonic, password);
  validateMnemonic(worlds.split(" "));
  return worlds;
};

export const useUnlockMutation = () => {
  const data = useContext(AccountStateContext);
  return useMutation<void, Error, string>(async (value) => {
    const [wallet] = data.wallets;
    await decryptMnemonic(wallet.mnemonic, value);
    sendBackground.message("tryToUnlock", value);
  });
};

export const useCreatePasswordMutation = () => {
  return useMutation<void, Error, [string, string]>(
    async ([password, confirm]) => {
      if (password !== confirm) {
        throw new Error("Confirm password incorrect");
      }
      await askBackground<void>().message("setPassword", password);
    }
  );
};
