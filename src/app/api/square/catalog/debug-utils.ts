import fs from 'fs'
import path from 'path'

export const writeDebugToFile = (data: any, prefix: string) => {
  try {
    const debugDir = path.join(process.cwd(), 'debug')
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true })
    }

    // Truncate data to 300 lines
    const dataString = JSON.stringify(data, null, 2)
    const lines = dataString.split('\n')
    const truncatedData = lines.slice(0, 300).join('\n')

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filePath = path.join(debugDir, `${prefix}-${timestamp}.json`)
    fs.writeFileSync(filePath, truncatedData)

    // Get all debug files and group by prefix
    const files = fs.readdirSync(debugDir)
    const filesByPrefix = new Map<string, string[]>()
    
    files.forEach(file => {
      const filePrefix = file.split('-')[0]
      if (!filesByPrefix.has(filePrefix)) {
        filesByPrefix.set(filePrefix, [])
      }
      filesByPrefix.get(filePrefix)?.push(file)
    })

    // Keep only the most recent file per prefix
    filesByPrefix.forEach((prefixFiles, filePrefix) => {
      const sortedFiles = prefixFiles.sort((a, b) => {
        const timeA = fs.statSync(path.join(debugDir, a)).mtime.getTime()
        const timeB = fs.statSync(path.join(debugDir, b)).mtime.getTime()
        return timeB - timeA
      })

      // Remove all but the most recent file for this prefix
      sortedFiles.slice(1).forEach(file => {
        try {
          fs.unlinkSync(path.join(debugDir, file))
        } catch (error) {
          console.error(`Error removing old debug file ${file}:`, error)
        }
      })
    })

    // Keep only 10 most recent files total
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
