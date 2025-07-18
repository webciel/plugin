import { Logger } from '#framework/logger'

const logger = new Logger('registry')

type OnMountFn = () => void | Promise<void>

interface RegistryEntry {
  fn: OnMountFn
  async: boolean
}

export const Registries: Record<string, RegistryEntry> = {}

export function Register(name: string, fn: OnMountFn, options: { async?: boolean } = {}): void {
  if (typeof name !== 'string') {
    logger.warn('Register', `Invalid name: "${name}"`)
    return
  }
  if (typeof fn !== 'function') {
    logger.warn('Register', `Invalid onMount function for "${name}"`)
    return
  }

  logger.log('Register', { name, async: options.async || false })
  Registries[name] = { fn, async: !!options.async }
}

export async function Execute(name: string): Promise<void> {
  if (typeof name !== 'string') {
    logger.warn('Execute', `Invalid name: "${name}"`)
    return
  }

  const entry = Registries[name]
  if (!entry?.fn) {
    logger.warn('Execute', `No function found for "${name}"`)
    return
  }

  logger.log('Execute', `Executing "${name}" (async: ${entry.async})`)
  entry.async ? await entry.fn() : entry.fn()
  logger.log('Execute', `Done: "${name}"`)
}
