import fs from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
const TARGET_EXT = new Set([".html", ".js"])
const IGNORE_DIRS = new Set([".git", "node_modules", "coverage", "dist", "build"])

const suspiciousPatterns = [
  { name: "replacement-char", regex: /\uFFFD/g },
  { name: "mojibake-Ã", regex: /Ã[\x80-\xBF]/g },
  { name: "mojibake-Â", regex: /Â[\x80-\xBF]/g },
  { name: "mojibake-â", regex: /â[\x80-\xBF]{1,2}/g },
]

const findings = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue

    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath)
      continue
    }

    if (!TARGET_EXT.has(path.extname(entry.name).toLowerCase())) continue
    checkFile(fullPath)
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8")
  const lines = content.split("\n")

  lines.forEach((line, idx) => {
    for (const pattern of suspiciousPatterns) {
      if (pattern.regex.test(line)) {
        findings.push({
          file: path.relative(ROOT, filePath),
          line: idx + 1,
          type: pattern.name,
          snippet: line.trim().slice(0, 180),
        })
        break
      }
      pattern.regex.lastIndex = 0
    }
  })
}

walk(ROOT)

if (findings.length) {
  console.error("Text integrity check failed. Found suspicious encoding artifacts:\n")
  for (const f of findings) {
    console.error(`- ${f.file}:${f.line} [${f.type}] ${f.snippet}`)
  }
  process.exit(1)
}

console.log("Text integrity check passed.")
