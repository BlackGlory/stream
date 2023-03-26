import { findUpPackageFilenameSync } from 'extra-filesystem'
import { fileURLToPath } from 'url'
import path from 'path'
import { assert } from '@blackglory/prelude'

export function getPackageFilename(): string {
  const packageFilename = findUpPackageFilenameSync(
    path.dirname(fileURLToPath(import.meta.url))
  )
  assert(packageFilename, 'The package.json not found')

  return packageFilename
}
