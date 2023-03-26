import path from 'path'
import { getPackageFilename } from '@utils/get-package-filename.js'

export function getAppRoot(): string {
  const packageFilename = getPackageFilename()

  return path.dirname(packageFilename)
}
