import ipfs from './ipfsClient.js';
import { saveAs } from 'file-saver';
import uint8arrays from 'uint8arrays';

async function saveFileCID(cid, name) {
  const chunks = []
  for await (const chunk of ipfs.cat(cid)) {
    chunks.push(chunk)
  }
  const file = uint8arrays.concat(chunks)
  const fileBlob = new Blob([file.buffer])
  saveAs(fileBlob, name)
}

export default saveFileCID