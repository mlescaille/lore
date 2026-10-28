function readEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = []
    const read = () => {
      reader.readEntries(
        (batch) => {
          if (batch.length === 0) resolve(all)
          else {
            all.push(...batch)
            read()
          }
        },
        () => reject(new Error('Could not read that folder')),
      )
    }
    read()
  })
}

async function walk(entry: FileSystemEntry, files: File[]): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => {
      ;(entry as FileSystemFileEntry).file(resolve, () => reject(new Error('Could not read a file')))
    })
    files.push(file)
    return
  }
  if (!entry.isDirectory) return
  const reader = (entry as FileSystemDirectoryEntry).createReader()
  const children = await readEntries(reader)
  for (const child of children) await walk(child, files)
}

export async function filesFromDataTransfer(data: DataTransfer): Promise<File[]> {
  const items = [...data.items].filter((item) => item.kind === 'file')
  const entries: FileSystemEntry[] = []
  for (const item of items) {
    try {
      const entry = item.webkitGetAsEntry?.() ?? null
      if (entry) entries.push(entry)
    } catch (error) {
      console.error('Lore failed during open', error)
    }
  }
  const files: File[] = []
  for (const entry of entries) {
    try {
      await walk(entry, files)
    } catch (error) {
      console.error('Lore failed during open', entry.name, error)
    }
  }
  if (files.length > 0) return files
  return [...data.files]
}
