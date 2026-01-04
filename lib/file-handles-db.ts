const DB_NAME = "llm-api-tester-db"
const DB_VERSION = 1
const STORE_NAME = "fileHandles"

export const verifyFilePermission = async (handle: FileSystemFileHandle): Promise<boolean> => {
  try {
    if (handle.queryPermission) {
      const status = await handle.queryPermission({ mode: "read" })

      if (status === "granted") {
        return true
      }

      if (handle.requestPermission) {
        const requestStatus = await handle.requestPermission({ mode: "read" })
        return requestStatus === "granted"
      }

      return false
    }

    return true
  } catch (error) {
    console.error("[v0] Error checking/requesting file permission:", error)
    return false
  }
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => {
      console.log("[v0] IndexedDB open error:", request.error)
      reject(request.error)
    }
    request.onsuccess = () => {
      console.log("[v0] IndexedDB opened successfully")
      resolve(request.result)
    }
    request.onupgradeneeded = (event) => {
      console.log("[v0] IndexedDB upgrade needed, creating object store")
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

export const saveFileHandle = async (key: string, handle: FileSystemFileHandle): Promise<boolean> => {
  console.log("[v0] saveFileHandle called with key:", key, "handle:", handle)
  try {
    const db = await openDB()
    console.log("[v0] DB opened for saving, starting transaction...")

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)

      console.log("[v0] Putting handle into store...")
      const request = store.put(handle, key)

      request.onerror = (e) => {
        console.log("[v0] Put request error:", request.error, e)
      }

      request.onsuccess = () => {
        console.log("[v0] Put request success for:", key)
      }

      tx.oncomplete = () => {
        console.log("[v0] Transaction completed successfully for:", key)
        db.close()
        resolve(true)
      }

      tx.onerror = (e) => {
        console.log("[v0] Transaction error:", tx.error, e)
        db.close()
        resolve(false)
      }

      tx.onabort = (e) => {
        console.log("[v0] Transaction aborted:", tx.error, e)
        db.close()
        resolve(false)
      }
    })
  } catch (error) {
    console.log("[v0] Error in saveFileHandle:", error)
    return false
  }
}

export const getFileHandle = async (key: string): Promise<FileSystemFileHandle | null> => {
  console.log("[v0] getFileHandle called with key:", key)
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(key)

      request.onerror = () => {
        console.log("[v0] Failed to get file handle:", request.error)
        db.close()
        resolve(null)
      }

      request.onsuccess = () => {
        const handle = request.result || null
        console.log("[v0] Got file handle from IndexedDB:", key, handle ? "found" : "not found")
        db.close()
        resolve(handle)
      }
    })
  } catch (error) {
    console.log("[v0] Error in getFileHandle:", error)
    return null
  }
}

export const deleteFileHandle = async (key: string): Promise<void> => {
  console.log("[v0] deleteFileHandle called with key:", key)
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)
      store.delete(key)

      tx.oncomplete = () => {
        console.log("[v0] Delete transaction completed for:", key)
        db.close()
        resolve()
      }

      tx.onerror = () => {
        console.log("[v0] Delete transaction error:", tx.error)
        db.close()
        resolve()
      }
    })
  } catch (error) {
    console.log("[v0] Failed to delete file handle from IndexedDB:", error)
  }
}

export type ReadTextFromHandleKeyResult =
  | { ok: true; content: string; handle: FileSystemFileHandle }
  | { ok: false; reason: "no_handle" | "permission_denied" | "read_failed"; handle: FileSystemFileHandle | null }

export const readTextFromHandleKey = async (
  handleKey: string,
  existingHandle: FileSystemFileHandle | null,
): Promise<ReadTextFromHandleKeyResult> => {
  let handle = existingHandle
  if (!handle) {
    handle = await getFileHandle(handleKey)
  }

  if (!handle) {
    return { ok: false, reason: "no_handle", handle: null }
  }

  try {
    const hasPermission = await verifyFilePermission(handle)
    if (!hasPermission) {
      return { ok: false, reason: "permission_denied", handle }
    }

    const file = await handle.getFile()
    const content = await file.text()
    return { ok: true, content, handle }
  } catch (error) {
    console.log("[v0] Failed to read from file handle key:", handleKey, error)
    await deleteFileHandle(handleKey)
    return { ok: false, reason: "read_failed", handle: null }
  }
}
