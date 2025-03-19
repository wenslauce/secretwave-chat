
import sodium from 'libsodium-wrappers';

/**
 * Initialize Sodium library
 */
export const initSodium = async () => {
  await sodium.ready;
  return sodium;
};

/**
 * Get the current user's key pair from local storage
 */
export const getUserKeyPair = (userId: string) => {
  const keyPairString = localStorage.getItem(`encryption_keypair_${userId}`);
  if (!keyPairString) return null;
  
  try {
    const keyPair = JSON.parse(keyPairString);
    return {
      publicKey: sodium.from_base64(keyPair.publicKey),
      privateKey: sodium.from_base64(keyPair.privateKey)
    };
  } catch (e) {
    console.error('Error parsing key pair:', e);
    return null;
  }
};

/**
 * Encrypt a message for a recipient
 */
export const encryptMessage = async (
  message: string,
  recipientPublicKeyBase64: string,
  senderUserId: string
): Promise<string | null> => {
  try {
    await sodium.ready;
    
    const senderKeyPair = getUserKeyPair(senderUserId);
    if (!senderKeyPair) {
      throw new Error('Sender key pair not found');
    }
    
    const recipientPublicKey = sodium.from_base64(recipientPublicKeyBase64);
    
    // Convert the message to Uint8Array
    const messageBytes = sodium.from_string(message);
    
    // Encrypt the message
    const encryptedMessage = sodium.crypto_box_easy(
      messageBytes,
      sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES),
      recipientPublicKey,
      senderKeyPair.privateKey
    );
    
    // Convert the encrypted message to a base64 string for storage
    return sodium.to_base64(encryptedMessage);
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

/**
 * Decrypt a message from a sender
 */
export const decryptMessage = async (
  encryptedMessageBase64: string,
  senderPublicKeyBase64: string,
  receiverUserId: string
): Promise<string | null> => {
  try {
    await sodium.ready;
    
    const receiverKeyPair = getUserKeyPair(receiverUserId);
    if (!receiverKeyPair) {
      throw new Error('Receiver key pair not found');
    }
    
    const senderPublicKey = sodium.from_base64(senderPublicKeyBase64);
    const encryptedMessage = sodium.from_base64(encryptedMessageBase64);
    
    // Decrypt the message
    const decryptedMessage = sodium.crypto_box_open_easy(
      encryptedMessage,
      sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES),
      senderPublicKey,
      receiverKeyPair.privateKey
    );
    
    // Convert the decrypted message from Uint8Array to string
    return sodium.to_string(decryptedMessage);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};
