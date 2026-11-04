import assert from "node:assert/strict"
import test from "node:test"
import { buildHistoryCsv } from "./csv"
import { modelHistoryWithoutKey, redactCredentials, redactHistoryItem, REDACTED_CREDENTIAL } from "./history-privacy"
import { loadModelHistoryFromStorage, MODEL_HISTORY_STORAGE_KEY, saveModelHistoryToStorage } from "./model-history-storage"
import { loadRequestHistoryFromStorage } from "./request-history-storage"
import type { HistoryItem, ModelHistoryItem } from "./types"

const key = "fixture+secret/&=value"
const item: HistoryItem = {
  id: "history-1", timestamp: 1234, model: "fixture-model", duration: 42,
  requestRaw: `curl https://api.example/v1 -H "Authorization: Bearer ${key}"`,
  requestContent: "hello", responseContent: key, responseRaw: `echo=${encodeURIComponent(key)}`,
}
const modelItem: ModelHistoryItem = {
  id: "model-1", timestamp: 1234, provider: "custom", model: "fixture-model", apiKey: key,
  baseURL: "https://api.example", apiPath: "/v1/chat/completions", status: "success", duration: 42,
}

for (const raw of [
  'curl https://api.example/v1 -H "Authorization: Bearer fixture-only-key"',
  '{"Authorization":"Bearer fixture-only-key"}',
  'Authorization: Basic fixture-only-key',
  "x-api-key: fixture-only-key", "x-goog-api-key: fixture-only-key",
  '{"api_key":"fixture-only-key"}', '{"apiKey":"fixture-only-key"}',
  "https://tester.example/?key=fixture-only-key&model=text",
  "https://tester.example/#key=fixture-only-key&model=text",
]) {
  test(`history credential redaction handles ${raw}`, () => {
    const clean = redactCredentials(raw)
    assert.ok(!clean.includes("fixture-only-key"))
    assert.ok(clean.includes(REDACTED_CREDENTIAL))
    assert.equal(redactCredentials(clean), clean)
  })
}

test("known keys and encoded server echoes are removed before a history item enters state", () => {
  const clean = redactHistoryItem(item, [key])
  assert.ok(!JSON.stringify(clean).includes(key))
  assert.ok(!JSON.stringify(clean).includes(encodeURIComponent(key)))
  assert.equal(clean.id, item.id)
  assert.equal(clean.model, item.model)
  assert.equal(clean.duration, item.duration)
  assert.equal(clean.requestContent, "hello")
  assert.ok(item.requestRaw.includes(key), "does not mutate the current request/copy view")
})

test("Router keys are scrubbed even when echoed outside an auth header", () => {
  assert.equal(redactCredentials("echo ccrt_fixture-key-123"), `echo ${REDACTED_CREDENTIAL}`)
})

test("history CSV and legacy localStorage data do not re-expose raw request credentials", () => {
  const legacy = { ...item, responseContent: "hello", responseRaw: "ok" }
  const csv = buildHistoryCsv({ history: [legacy], showRawColumns: true })
  assert.ok(!csv.includes(key))
  assert.ok(csv.includes(REDACTED_CREDENTIAL))
  const [loaded] = loadRequestHistoryFromStorage({ getItem: () => JSON.stringify([legacy]) })
  assert.ok(!loaded.requestRaw.includes(key))
})

test("model history persistence and legacy migration retain metadata but never a plaintext Key", () => {
  const records = new Map([[MODEL_HISTORY_STORAGE_KEY, JSON.stringify([modelItem])]])
  const storage = {
    getItem: (name: string) => records.get(name) ?? null,
    setItem: (name: string, value: string) => { records.set(name, value) },
  }
  const clean = modelHistoryWithoutKey(modelItem)
  assert.deepEqual(loadModelHistoryFromStorage(storage), [clean])
  assert.ok(!records.get(MODEL_HISTORY_STORAGE_KEY)!.includes(key))
  saveModelHistoryToStorage(storage, [modelItem])
  assert.ok(!records.get(MODEL_HISTORY_STORAGE_KEY)!.includes(key))
  assert.equal(JSON.parse(records.get(MODEL_HISTORY_STORAGE_KEY)!)[0].apiKey, "")
  assert.equal(modelItem.apiKey, key, "an in-memory session remains manually replayable")
})

test("read-only storage still returns sanitized model history", () => {
  const loaded = loadModelHistoryFromStorage({
    getItem: () => JSON.stringify([modelItem]),
    setItem: () => { throw new Error("Storage denied") },
  })
  assert.equal(loaded[0].apiKey, "")
  assert.equal(loaded[0].status, "success")
})
