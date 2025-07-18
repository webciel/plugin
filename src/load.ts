import { RefreshIcons } from '#framework/icons'
import { Registries, Execute } from '#framework/registry'
import { applyTranslations } from '#framework/locale'
import { Logger } from '#framework/logger'

const logger = new Logger('load')

type LoadMode = 'append' | 'prepend' | 'innerHTML'

interface LoadTemplateOptions {
  element: HTMLElement
  mode: LoadMode
  replacements?: Record<string, string>
}

interface LoadIncludesResult {
  htmlContent: string
  includes: Array<{ registry: string }>
}

function isScriptAlreadyLoaded(src: string): boolean {
  return Array.from(document.scripts).some(script => script.src === src)
}

function cachedViewKey(path: string): string {
  return `[commanders_act_assistant:framework:load:${path}]`
}

async function fetchWithCache(path: string): Promise<string> {
  const cacheKey = cachedViewKey(path)
  const cachedItem = sessionStorage.getItem(cacheKey)
  if (cachedItem) return cachedItem

  const url = chrome.runtime.getURL(path)
  const response = await fetch(url)
  const text = await response.text()
  sessionStorage.setItem(cacheKey, text)
  return text
}

async function LoadScripts(htmlContent: string, basePath: string): Promise<void> {
  const scriptRegex = /<!--\s*script\(['"]([^'"]+)['"]\)\s*-->/g
  const scriptPromises: Promise<void>[] = []
  let match: RegExpExecArray | null

  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    const scriptName = match[1]
    const scriptSrc = chrome.runtime.getURL(`${basePath}/${scriptName}.js`)
    if (!isScriptAlreadyLoaded(scriptSrc)) {
      scriptPromises.push(new Promise(resolve => {
        const script = document.createElement('script')
        script.type = 'module'
        script.src = scriptSrc
        script.onload = () => resolve()
        document.body.appendChild(script)
      }))
    }
  }

  await Promise.all(scriptPromises)
}

export async function LoadTemplate(templatePath: string, options: LoadTemplateOptions): Promise<void> {
  try {
    let htmlContent = await fetchWithCache(`templates/${templatePath}/index.html`)
    const templateRegistry = `templates/${templatePath}`

    await LoadScripts(htmlContent, templateRegistry)

    const {
      element,
      mode,
      replacements = {},
    } = options

    for (const [key, value] of Object.entries(replacements)) {
      htmlContent = htmlContent.replaceAll(`{${key}}`, value)
    }

    htmlContent = applyTranslations(htmlContent)

    if (mode === 'innerHTML') {
      element.innerHTML = htmlContent
    } else {
      element[mode](htmlContent)
    }

    if (Registries?.[templateRegistry]) {
      await Execute(templateRegistry)
    }

    RefreshIcons()
  } catch (error) {
    logger.error('LoadTemplate', `Failed to load template: ${templatePath}`, { error })
  }
}

export async function LoadPage(name: string): Promise<void> {
  try {
    let htmlContent = await fetchWithCache(`pages/${name}/index.html`)
    htmlContent = applyTranslations(htmlContent)

    const { htmlContent: replacedHtml, includes } = await LoadIncludes(htmlContent)

    const rootElement = document.getElementById('_root')
    if (!rootElement) throw new Error('Element with ID "_root" not found')

    const pageRegistry = `pages/${name}`
    await LoadScripts(replacedHtml, pageRegistry)

    rootElement.innerHTML = replacedHtml

    if (Registries?.[pageRegistry]) {
      await Execute(pageRegistry)
    }

    for (const include of includes) {
      if (Registries?.[include.registry]) {
        await Execute(include.registry)
      }
    }

    RefreshIcons()
    SetCurrentPage(name)
  } catch (error) {
    logger.error('LoadPage', `Error loading page: ${name}`, { error })
  }
}

export async function LoadIncludes(htmlContent: string): Promise<LoadIncludesResult> {
  const includeRegex = /<!--\s*include\(['"]([^'"]+)['"]\)\s*-->/g
  const includes: Array<{ registry: string }> = []
  let match: RegExpExecArray | null

  while ((match = includeRegex.exec(htmlContent)) !== null) {
    const includeName = match[1]
    const includeRegistry = `includes/${includeName}`
    let includeContent = await fetchWithCache(`includes/${includeName}/index.html`)
    includeContent = applyTranslations(includeContent)
    await LoadScripts(includeContent, includeRegistry)

    htmlContent = htmlContent.replace(match[0], includeContent)
    includes.push({ registry: includeRegistry })
  }

  return { htmlContent, includes }
}

export function SetCurrentPage(name: string): void {
  const rootElement = document.getElementById('_root')
  if (!rootElement) {
    logger.error('SetCurrentPage', 'Element with ID "_root" not found')
    return
  }
  rootElement.setAttribute('data-current-page', name)
}

export function GetCurrentPage(): string | null {
  const rootElement = document.getElementById('_root')
  if (!rootElement) {
    logger.error('GetCurrentPage', 'Element with ID "_root" not found')
    return null
  }
  return rootElement.getAttribute('data-current-page')
}
