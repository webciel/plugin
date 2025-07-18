import feather from 'feather-icons'
import { Logger } from '#framework/logger'

const logger = new Logger('icons')

export function RefreshIcons() {
  feather.replace()
  logger.log('RefreshIcons', 'All icons refreshed!')
}