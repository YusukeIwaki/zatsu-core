import path from 'path'
import fs from 'fs'

interface Cache {
    get(): Promise<Buffer | undefined>
    put(content: Buffer): Promise<void>
    delete(): Promise<void>
}

export function useFileCache(dirname: string, filename: string): Cache {
    function cacheDirPath(name: string) {
        if (process.platform == 'win32') {
            return path.join(
                process.env['USERPROFILE']!,
                'AppData',
                'Roaming',
                name,
            )
        } else {
            return path.join(process.env['HOME']!, `.${name}`)
        }
    }

    class FileCache implements Cache {
        private dirPath: string
        private filePath: string

        constructor(dirPath: string, filePath: string) {
            this.dirPath = dirPath
            this.filePath = filePath
        }

        async get(): Promise<Buffer | undefined> {
            try {
                return await fs.promises.readFile(this.filePath)
            } catch (_) {
            }
        }

        async put(content: Buffer | string) {
            await fs.promises.mkdir(this.dirPath, { recursive: true })
            await fs.promises.writeFile(this.filePath, content)
        }

        async delete() {
            try {
                await fs.promises.unlink(this.filePath)
            } catch (_) {
            }
        }
    }

    const cacheDirectoryPath = cacheDirPath(dirname)
    const cacheFilePath = path.join(cacheDirectoryPath, filename)

    return new FileCache(cacheDirectoryPath, cacheFilePath)
}
