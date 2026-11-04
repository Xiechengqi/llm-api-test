import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import ts from "typescript"
import { indexedDB } from "fake-indexeddb"
import { initDB, loadHistoryFromDB, saveHistoryToDB } from "../indexed-db"
import { readTextFromHandleKey } from "../file-handles-db"

const page = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8")

test("no effect automatically starts a model request, probe or timer", () => {
  const source = ts.createSourceFile("page.tsx", page, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let effects = 0
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && node.expression.getText(source) === "useEffect") {
      effects++
      const effect = node.arguments[0]
      function assertManualOnly(child: ts.Node) {
        if (ts.isCallExpression(child)) {
          assert.ok(!["runProbeTest", "handleTest", "startTimer", "handleStartTest"].includes(child.expression.getText(source)), "model calls must originate in an explicit user action")
        }
        ts.forEachChild(child, assertManualOnly)
      }
      ts.forEachChild(effect, assertManualOnly)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.ok(effects > 5)
})

test("temporary imports mount only after capture and disable persistent bootstrap/history/images/actions", () => {
  assert.match(page, /captured\.current \?\?= captureShareLaunch\(window\)/)
  assert.match(page, /if \(!launch\) return/)
  assert.match(page, /useAppDataBootstrap\(\{\s*enabled: !isTemporarySession/)
  assert.match(page, /usePersistHistoryToDB\(history, \{ enabled: canPersist \}\)/)
  assert.match(page, /usePersistImagesToDB\(messageImages, \{ enabled: canPersist \}\)/)
  assert.match(page, /useHistoryActions\(\{\s*persistent: !isTemporarySession/)
  assert.match(page, /if \(!canPersist\) return\s*saveSettingsToStorage/)
  assert.match(page, /if \(!canPersist \|\| typeof window === "undefined"\) return\s*saveModelHistoryToStorage/)
  assert.match(page, /if \(isTemporarySession \|\| !providersLoaded \|\| typeof window === "undefined"\) return\s*saveCustomProvidersToStorage/)
  assert.equal((page.match(/if \(!isTemporarySession\) localStorage\.removeItem/g) ?? []).length, 2)
  assert.match(page, /if \(!isTemporarySession\) clearModelHistoryFromStorage/)
  const bootstrap = readFileSync(new URL("../../hooks/use-app-data-bootstrap.ts", import.meta.url), "utf8")
  assert.match(bootstrap, /if \(!enabled\) return/)
  assert.match(bootstrap, /canPersist: enabled && status === "ready"/)
  assert.match(bootstrap, /setStatus\("unavailable"\)/)
})

test("request-history IndexedDB stores redacted curl, not a reusable credential", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "indexedDB")
  Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: indexedDB })
  try {
    const key = "fixture-only-request-key"
    await saveHistoryToDB([{
      id: "fixture-history", timestamp: 1234, model: "fixture-model", requestContent: "hello",
      requestRaw: `curl https://api.example -H "Authorization: Bearer ${key}"`, responseContent: "hello", responseRaw: "ok",
    }])
    const db = await initDB()
    const stored = await new Promise<unknown[]>((resolve, reject) => {
      const request = db.transaction("history", "readonly").objectStore("history").getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    db.close()
    assert.ok(!JSON.stringify(stored).includes(key))
    const loaded = await loadHistoryFromDB()
    assert.equal(loaded.length, 1)
    assert.equal(loaded[0].model, "fixture-model")
    assert.ok(!loaded[0].requestRaw.includes(key))
  } finally {
    if (original) Object.defineProperty(globalThis, "indexedDB", original)
    else Reflect.deleteProperty(globalThis, "indexedDB")
  }
})

test("temporary local-file reload never restores or deletes handles from another saved session", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "indexedDB")
  Object.defineProperty(globalThis, "indexedDB", { configurable: true, get: () => { assert.fail("temporary session touched IndexedDB") } })
  try {
    assert.deepEqual(await readTextFromHandleKey("promptFileHandle", null, { persistent: false }), {
      ok: false, reason: "no_handle", handle: null,
    })
  } finally {
    if (original) Object.defineProperty(globalThis, "indexedDB", original)
    else Reflect.deleteProperty(globalThis, "indexedDB")
  }
})
