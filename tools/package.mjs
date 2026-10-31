// Zips the CONTENTS of dist/ (not the folder) into cut-n-curl-site.zip — the
// file to upload into public_html on Hostinger and extract in place.
//
// Written here rather than with PowerShell's Compress-Archive, which on
// Windows stores entry names with backslashes; a Linux host's extractor then
// creates files literally called "assets\index.js" instead of folders. This
// writer stores forward slashes, marks the archive as Unix-made, and includes
// dot-files, so .htaccess travels with the site. No dependency needed.
import { deflateRawSync, crc32 } from 'node:zlib'
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const dist = resolve('dist')
const out = resolve('cut-n-curl-site.zip')

if (!existsSync(join(dist, 'index.html'))) {
  console.error('dist/index.html not found — run `npm run build` first.')
  process.exit(1)
}
if (!existsSync(join(dist, '.htaccess'))) {
  console.error('dist/.htaccess missing — public/.htaccess should have been copied by the build.')
  process.exit(1)
}

/** Every file under dist/, as forward-slash paths relative to it. */
function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else files.push(relative(dist, full).split('\\').join('/'))
  }
  return files.sort()
}

/** DOS date/time pair for a zip header. */
function dosTime(d) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
  return { time, date }
}

const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b }
const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b }

const locals = []
const central = []
let offset = 0
let bytesIn = 0

for (const name of walk(dist)) {
  const data = readFileSync(join(dist, name))
  bytesIn += data.length
  const crc = crc32(data)
  // Films, images and fonts are already compressed: store them as-is. Text deflates.
  const store = /\.(mp4|webm|jpg|jpeg|png|woff2|glb)$/i.test(name)
  const packed = store ? data : deflateRawSync(data, { level: 9 })
  const method = store ? 0 : 8
  const nameBuf = Buffer.from(name, 'utf8')
  const { time, date } = dosTime(statSync(join(dist, name)).mtime)
  const flags = 0x0800 // names are UTF-8

  const local = Buffer.concat([
    u32(0x04034b50), u16(20), u16(flags), u16(method), u16(time), u16(date),
    u32(crc), u32(packed.length), u32(data.length), u16(nameBuf.length), u16(0), nameBuf, packed,
  ])
  central.push(Buffer.concat([
    u32(0x02014b50),
    u16((3 << 8) | 20), // made by: Unix host, so names are taken literally
    u16(20), u16(flags), u16(method), u16(time), u16(date),
    u32(crc), u32(packed.length), u32(data.length),
    u16(nameBuf.length), u16(0), u16(0), u16(0), u16(0),
    u32(0o100644 << 16), // regular file, rw-r--r--
    u32(offset), nameBuf,
  ]))
  locals.push(local)
  offset += local.length
}

const centralBuf = Buffer.concat(central)
const end = Buffer.concat([
  u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length),
  u32(centralBuf.length), u32(offset), u16(0),
])

if (existsSync(out)) rmSync(out)
writeFileSync(out, Buffer.concat([...locals, centralBuf, end]))

console.log(`${central.length} files, ${(bytesIn / 1048576).toFixed(1)} MB → ${out} (${(statSync(out).size / 1048576).toFixed(1)} MB)`)
console.log('Upload to public_html on Hostinger and extract there.')
