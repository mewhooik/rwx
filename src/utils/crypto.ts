import CryptoJS from "crypto-js";

const getSecretKey = (): string => {
  const codes = [84, 111, 112, 112, 101, 114, 115, 66, 97, 116, 99, 104, 72, 117, 98, 83, 101, 99, 114, 101, 116, 75, 101, 121, 50, 48, 50, 54, 95, 65, 69, 83];
  return String.fromCharCode(...codes);
};

export function encryptData(data: any): string {
  return CryptoJS.AES.encrypt(JSON.stringify(data), getSecretKey()).toString();
}

export function decryptResponse(json: any): any {
  if (json && typeof json === "object" && "encData" in json && typeof json.encData === "string") {
    try {
      const bytes = CryptoJS.AES.decrypt(json.encData, getSecretKey());
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      if (decryptedText) {
        return JSON.parse(decryptedText);
      }
    } catch (e) {
      console.error("Decryption failed:", e);
    }
  }
  return json;
}
