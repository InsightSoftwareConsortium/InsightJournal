import ipfs from './ipfsClient.js';
import { saveAs } from 'file-saver';
import uint8arrays from 'uint8arrays';
import JSZip from 'jszip';

async function saveFileZipCID(cid, name) {
  const chunks = []
  for await (const chunk of ipfs.cat(cid)) {
    chunks.push(chunk)
  }
  const file = uint8arrays.concat(chunks)
  const zip = new JSZip()
  zip.file(name, file)
  zip.generateAsync({ type: 'blob' }).then((content) => {
    saveAs(content, `${name}.zip`)
  })
}

export default saveFileZipCID