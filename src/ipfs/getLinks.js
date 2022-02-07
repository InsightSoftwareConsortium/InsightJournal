import idbStore from './idbStore.js';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import ipfs from './ipfsClient.js';

async function getLinks(ipfsPath) {
  let links = await idbGet(ipfsPath, idbStore)
  if(links === undefined) {
    links = []
    for await (const link of ipfs.ls(ipfsPath)) {
      links.push(link)
    }
    links.forEach((link) => link.cid = link.cid.toString())
    await idbSet(ipfsPath, links, idbStore)
  }
  return links
}

export default getLinks