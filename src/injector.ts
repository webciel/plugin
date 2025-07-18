import { Logger } from '#framework/logger'

const logger = new Logger('injector')

type TabCallback = (tabId: number) => Promise<void>
type ResponseFn = (response: any) => void

/**
 * Finds the active tab in the current window and executes a callback with its tabId.
 */
export async function handleActiveTab(callback: TabCallback, next?: ResponseFn): Promise<void> {
  logger.log('handleActiveTab')

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tabs.length) {
    next?.({ status: "error", error: "No active tab found" })
    return
  }

  const tabId = tabs[0].id
  if (tabId == null) {
    next?.({ status: "error", error: "Tab ID is undefined" })
    return
  }

  logger.log('handleActiveTab', { tabId })
  await callback(tabId)
}

/**
 * Fetches a script from the extension's `scripts/` folder.
 * Throws an error if the file does not exist or cannot be loaded.
 */
export async function fetchScript(name: string): Promise<string> {
  const path = `scripts/${name}.js`
  const url = chrome.runtime.getURL(path)

  logger.log('fetchScript', { name, path, url })

  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`[webciel-plugin:injector:fetchScript] Script not found or failed: ${res.status} (${res.statusText})`)
    }
    return res.text()
  } catch (err) {
    logger.error('fetchScript', { name, url, error: err })
    throw new Error(`Script "${name}" could not be loaded from ${url}`)
  }
}

/**
 * Inject a script into the main world of the active tab.
 */
export async function injectScript(tabId: number, name: string): Promise<void> {
  const content = await fetchScript(name)

  logger.log('injectScript', { tabId, name })

  await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: (scriptName: string, scriptContent: string) => {
      const id = `webciel-plugin-injected-${scriptName}`
      const existing = document.querySelector(`#${id}`)

      if (existing) {
        logger.log('injectScript',{ id })
        existing.remove()
      }

      const script = document.createElement('script')
      script.id = id
      script.textContent = scriptContent
      document.documentElement.prepend(script)

      logger.log('injectScript', { id })
    },
    args: [name, content],
  })
}