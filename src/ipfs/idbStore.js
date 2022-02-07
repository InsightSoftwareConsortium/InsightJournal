import { createStore } from 'idb-keyval'

let idbStore
if (typeof window !== "undefined") {
  idbStore = createStore('insight-journal', 'ipfs')
}

export default idbStore