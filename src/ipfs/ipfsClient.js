import { create as createIpfsClient } from 'ipfs-http-client';

const ipfsAPIUrl = 'https://dweb.link/api/v0'
const ipfsClient = typeof window !== "undefined" ? createIpfsClient({ url: ipfsAPIUrl }) : null

export default ipfsClient
