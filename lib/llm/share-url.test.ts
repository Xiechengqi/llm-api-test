import assert from "node:assert/strict"
import test from "node:test"
import { createServer } from "node:http"
import { buildShareUrl, captureShareLaunch, parseShareSearch, readShareLaunch, settingsForShareLaunch, stripShareSearch } from "./share-url"
import type { SettingsState } from "./page-state"

const apiKey = "ccrt_fixture+&=?/#%"
const endpoint = "https://share.router.example:8443/v1/chat/completions"
const model = "vendor/model+name@high?x=%23&y=模型#part"
const fragment = new URLSearchParams({ api: endpoint, key: apiKey, model }).toString()
const sharedUrl = `https://tester.example/?theme=dark#${fragment}`

test("new sharing links keep API, Key and model in the fragment, not the HTTP request URL", () => {
  const url = new URL(buildShareUrl({
    pageUrl: "https://tester.example/?theme=dark&key=old-query-key#old-anchor",
    baseURL: "https://share.router.example:8443/", apiPath: "/v1/chat/completions", apiKey, model,
  }))
  assert.equal(url.search, "?theme=dark")
  const params = new URLSearchParams(url.hash.slice(1))
  assert.equal(params.get("api"), endpoint)
  assert.equal(params.get("key"), apiKey)
  assert.equal(params.get("model"), model)
  assert.ok(!url.search.includes("key"))
  assert.ok(!url.href.includes("old-query-key"))
  assert.deepEqual(readShareLaunch(url.href).session, {
    mode: "temporary", invalid: false,
    patch: { provider: "custom", baseURL: "https://share.router.example:8443", apiPath: "/v1/chat/completions", apiKey, model },
  })
})

test("a real loopback HTTP page request never contains the fragment credential", async () => {
  const requests: string[] = []
  const server = createServer((request, response) => {
    requests.push(request.url ?? "")
    response.end("fixture static page")
  })
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  try {
    const address = server.address()
    assert.ok(address && typeof address !== "string")
    const url = buildShareUrl({
      pageUrl: `http://127.0.0.1:${address.port}/?theme=dark`,
      baseURL: "https://share.router.example", apiPath: "/v1/chat/completions", apiKey, model,
    })
    const response = await fetch(url)
    assert.equal(response.status, 200)
    await response.text()
    assert.deepEqual(requests, ["/?theme=dark"])
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})

test("legacy query links still work but enter the same temporary session and are cleaned", () => {
  const result = readShareLaunch(`https://tester.example/?${fragment}&theme=dark#help`)
  assert.equal(result.session.mode, "temporary")
  if (result.session.mode !== "temporary") assert.fail()
  assert.equal(result.session.patch.apiKey, apiKey)
  assert.equal(result.cleanUrl, "https://tester.example/?theme=dark#help")
})

test("fragment wins as a complete connection; credentials are never mixed with query fields", () => {
  const result = readShareLaunch("https://tester.example/?api=https%3A%2F%2Fwrong.example%2Fv1&key=query-key#model=fragment-model")
  assert.deepEqual(result.session, { mode: "temporary", invalid: false, patch: { model: "fragment-model" } })
  assert.equal(result.cleanUrl, "https://tester.example/")
})

test("a partial import never restores an old endpoint or credential implicitly", () => {
  assert.deepEqual(readShareLaunch("https://tester.example/#key=fixture-only").session, {
    mode: "temporary", invalid: false, patch: { apiKey: "fixture-only" },
  })
  assert.deepEqual(parseShareSearch("#api=&key=&model="), { provider: "custom", baseURL: "", apiPath: "", apiKey: "", model: "" })
})

test("initial temporary settings clear all omitted connection fields, including invalid payloads", () => {
  const oldSettings = { provider: "old-provider", baseURL: "https://old.example", apiPath: "/old", apiKey: "old-key", model: "old-model" } as SettingsState
  const fresh = settingsForShareLaunch(oldSettings, { mode: "temporary", patch: { model: "new-model" }, invalid: false })
  assert.equal(fresh.provider, "custom")
  assert.equal(fresh.baseURL, "")
  assert.equal(fresh.apiKey, "")
  assert.equal(fresh.model, "new-model")
  const invalid = settingsForShareLaunch(oldSettings, { mode: "temporary", patch: { apiKey: "do-not-import" }, invalid: true })
  assert.equal(invalid.apiKey, "")
  assert.deepEqual(settingsForShareLaunch(oldSettings, { mode: "saved" }), oldSettings)
  assert.equal(oldSettings.apiKey, "old-key")
})

test("ordinary page parameters and anchors are not imports", () => {
  const href = "https://tester.example/?theme=dark#help"
  assert.deepEqual(readShareLaunch(href), { session: { mode: "saved" }, cleanUrl: href })
  assert.equal(parseShareSearch("?theme=dark"), null)
})

for (const api of ["javascript:alert(1)", "data:text/plain,test", "/v1/chat/completions", "https://user:secret@api.example/v1", "https://api.example/v1#secret", "not-a-url"]) {
  test(`unsafe endpoint stays isolated and is scrubbed: ${api}`, () => {
    const result = readShareLaunch(`https://tester.example/#${new URLSearchParams({ api, key: "fixture-key" })}`)
    assert.deepEqual(result.session, { mode: "temporary", invalid: true, patch: {} })
    assert.equal(result.cleanUrl, "https://tester.example/")
  })
}

for (const payload of ["key=one&key=two", "api=https%3A%2F%2Fapi.example&api=https%3A%2F%2Fwrong.example", "model=one&model=two", "key=fixture%0Akey", "model=model%00name"]) {
  test(`ambiguous or control-character import is rejected without falling back to saved state: ${payload}`, () => {
    const result = readShareLaunch(`https://tester.example/#${payload}`)
    assert.deepEqual(result.session, { mode: "temporary", invalid: true, patch: {} })
    assert.equal(result.cleanUrl, "https://tester.example/")
  })
}

test("cleanup removes both legacy and fragment credentials while preserving unrelated parameters", () => {
  assert.equal(stripShareSearch(`https://tester.example/?theme=dark&key=legacy#${fragment}&panel=details`),
    "https://tester.example/?theme=dark#panel=details")
})

test("capture scrubs synchronously, preserves history state, and does not touch storage or fetch", () => {
  const calls: unknown[][] = []
  const state = { fixture: "existing-state" }
  const session = captureShareLaunch({ location: { href: sharedUrl }, history: {
    state,
    replaceState: (...args: unknown[]) => { calls.push(args) },
  } })
  assert.equal(session.mode, "temporary")
  assert.deepEqual(calls, [[state, "", "https://tester.example/?theme=dark"]])
  assert.ok(!JSON.stringify(calls).includes("fixture+"))
})

test("a cleanup failure discards imported credentials without surfacing a sensitive exception", () => {
  const result = captureShareLaunch({ location: { href: sharedUrl }, history: {
    state: null,
    replaceState: () => { throw new Error(`Cannot navigate: ${sharedUrl}`) },
  } })
  assert.deepEqual(result, { mode: "temporary", invalid: true, patch: {} })
  assert.ok(!JSON.stringify(result).includes(apiKey))
})

test("HTTP loopback endpoints and endpoint version query strings remain usable for manual testing", () => {
  assert.deepEqual(parseShareSearch("#api=http%3A%2F%2Flocalhost%3A8080%2Fv1%2Fchat%2Fcompletions%3Fversion%3D1"), {
    provider: "custom", baseURL: "http://localhost:8080", apiPath: "/v1/chat/completions?version=1",
  })
})
