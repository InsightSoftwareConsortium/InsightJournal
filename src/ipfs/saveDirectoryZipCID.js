import { saveAs } from 'file-saver';
import uint8arrays from 'uint8arrays';
import JSZip from 'jszip';

import ipfs from './ipfsClient.js';

async function saveFileZip(zip, path, cid, chunksLoaded, setChunksLoaded) {
  const chunks = []
  for await (const chunk of ipfs.cat(cid)) {
    setChunksLoaded && setChunksLoaded(chunksLoaded++)
    chunks.push(chunk)
  }
  const file = uint8arrays.concat(chunks)
  zip.file(path, file)
  return chunksLoaded
}

async function saveDirectoryZip(zip, prefix, cid, chunksLoaded, setChunksLoaded) {
  setChunksLoaded && setChunksLoaded(chunksLoaded++)
  for await (const file of ipfs.ls(cid)) {
    const cid = file.cid.toString()
    if (file.type === 'dir') {
      chunksLoaded = await saveDirectoryZip(zip, `${prefix}/${file.name}`, cid, chunksLoaded, setChunksLoaded)
    } else {
      chunksLoaded = await saveFileZip(zip, `${prefix}/${file.name}`, cid, chunksLoaded, setChunksLoaded)
    }
  }
  return chunksLoaded
}

async function saveDirectoryZipCID(cid, name, setChunksLoaded) {
  const zip = new JSZip()
  let chunksLoaded = 0
  await saveDirectoryZip(zip, name, cid, chunksLoaded, setChunksLoaded)
  setChunksLoaded && setChunksLoaded(0)
  zip.generateAsync({ type: 'blob' }).then((content) => {
    saveAs(content, `${name}.zip`)
  })
}

export default saveDirectoryZipCID