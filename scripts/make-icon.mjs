// build/icon.svg → build/icon.png (512) + build/icon.ico (멀티 사이즈)
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import pngToIco from 'png-to-ico'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(join(root, 'build/icon.svg'), 'utf8')

function renderPng(size) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  return Buffer.from(r.render().asPng())
}

// 메인 PNG (512)
const png512 = renderPng(512)
writeFileSync(join(root, 'build/icon.png'), png512)

// ICO: Windows 권장 사이즈들
const sizes = [16, 24, 32, 48, 64, 128, 256]
const buffers = sizes.map(renderPng)
const ico = await pngToIco(buffers)
writeFileSync(join(root, 'build/icon.ico'), ico)

console.log('생성됨: build/icon.png (512), build/icon.ico (' + sizes.join(',') + ')')
