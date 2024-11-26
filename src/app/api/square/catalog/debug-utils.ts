import fs from 'fs'
import path from 'path'

export function writeDebugToFile(data: any, prefix: string): void {
  try {
    const debugDir = path.join(process.cwd(), 'debug')
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true })
    }

    const dataString = JSON.stringify(data, null, 2)
    const lines = dataString.split('\n')
    const truncatedData = lines.slice(0, 100).join('\n')

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filePath = path.join(debugDir, `${prefix}-${timestamp}.json`)
    fs.writeFileSync(filePath, truncatedData)

    const files = fs.readdirSync(debugDir)
    const filesByPrefix = new Map<string, string[]>()
    
    files.forEach(file => {
      const filePrefix = file.split('-')[0]
      if (!filesByPrefix.has(filePrefix)) {
        filesByPrefix.set(filePrefix, [])
      }
      filesByPrefix.get(filePrefix)?.push(file)
    })

    filesByPrefix.forEach((prefixFiles, filePrefix) => {
      const sortedFiles = prefixFiles.sort((a, b) => {
        const timeA = fs.statSync(path.join(debugDir, a)).mtime.getTime()
        const timeB = fs.statSync(path.join(debugDir, b)).mtime.getTime()
        return timeB - timeA
      })

      sortedFiles.slice(1).forEach(file => {
        try {
          fs.unlinkSync(path.join(debugDir, file))
        } catch (error) {
          console.error(`Error removing old debug file ${file}:`, error)
        }
      })
    })

    const allFiles = fs.readdirSync(debugDir)
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(debugDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time)

    allFiles.slice(10).forEach(file => {
      try {
        fs.unlinkSync(path.join(debugDir, file.name))
      } catch (error) {
        console.error(`Error removing old debug file ${file.name}:`, error)
      }
    })

  } catch (error) {
    console.error(`Error writing debug file for ${prefix}:`, error)
  }
}
