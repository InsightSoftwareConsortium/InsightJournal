import { create as createIpfsClient } from 'ipfs-http-client';

const ipfsAPIUrl = 'https://dweb.link/api/v0'
const ipfsClient = createIpfsClient({ url: ipfsAPIUrl })

export default ipfsClient