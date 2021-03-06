import fs from 'fs'
import path from 'path'
import { executeRequest as _executeRequest, Request, RequestContext, Response, PerformRequest } from './http'
import { updateKeyValue } from './util'

const supportedMethods = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] as const
type Method = typeof supportedMethods[number]

type ParseResult = {
    method: Method
    path: string
    queryParameters: URLSearchParams
    headers: Array<[string, string]>
    magicParameters: { body?: string }
}

function validatedMethodFor(arg0: string | undefined): Method {
    if (!arg0) {
        throw new Error(`HTTP method is not specified`)
    }
    const method = arg0 as Method
    if (!supportedMethods.includes(method)) {
        throw new Error(`HTTP method must be one of (${supportedMethods})`)
    }
    return method
}

function validatedPathFor(arg1: string | undefined): string {
    if (!arg1) {
        throw new Error(`path is not specified`)
    }
    if (!arg1.startsWith('/')) {
        throw new Error(`path must start with '/'`)
    }
    return arg1
}

type ParamsAndHeaders = {
    queryParams: Array<[string, string]>
    magicParams: Array<[string, string]>
    headers: Array<[string, string]>
}

function parseParamsAndHeaders(restArgs: Array<string>): ParamsAndHeaders {
    const queryParams: Array<[string, string]> = []
    const magicParams: Array<[string, string]> = []
    const headers: Array<[string, string]> = []

    const paramRegExp = /^@?([a-zA-Z_]+)=/
    const headerRegExp = /^([a-zA-Z_-]+):/
    let cur: Array<[string, string]> | undefined

    restArgs.forEach(arg => {
        let match = arg.match(paramRegExp)
        if (!!match) {
            const name = match[1]
            const value = arg.substring(match[0].length)

            if (arg.startsWith('@')) {
                cur = magicParams
            } else {
                cur = queryParams
            }

            cur.push([name, value])
            return
        }

        match = arg.match(headerRegExp)
        if (!!match) {
            const name = match[1]
            const value = arg.substring(match[0].length)

            cur = headers
            cur.push([name, value])
            return
        }

        if (!cur) {
            throw new Error(`Unable to parse args: ${restArgs.join(" ")}`)
        }
        const [name, value] = cur.pop()!
        if (!value) {
            cur.push([name, arg])
        } else {
            cur.push([name, `${value} ${arg}`])
        }
    })

    return { queryParams, magicParams, headers }
}

// @visibleForTesting
export function _parseArguments(args: Array<string>): ParseResult {
    const method = validatedMethodFor(args[0])
    const pathWithQuery = validatedPathFor(args[1])
    const { queryParams, magicParams, headers } = parseParamsAndHeaders(args.slice(2))

    const url = new URL(`https://example.com${pathWithQuery}`)
    const queryParameters = url.searchParams
    queryParams.forEach(([name, value]) => {
        queryParameters.append(name, value)
    })
    const magicParameters: { body?: string } = {}
    magicParams.forEach(([name, value]) => {
        if (name == 'body') {
            magicParameters.body = value
        } else {
            throw new Error(`Unknown key: "@${name}=${value}"`)
        }
    })

    return {
        method,
        path: url.pathname,
        queryParameters,
        headers,
        magicParameters,
    }
}

function resolveHomePath(filepath: string): string {
    if (filepath[0] === '~' && process.env.HOME) {
        return path.join(process.env.HOME, filepath.slice(1))
    }
    return filepath
}

async function readStdinAsBuffer(): Promise<Buffer> {
    const data = [];
    for await (const chunk of process.stdin) data.push(chunk)
    return Buffer.concat(data);
}

export async function buildRequestFromArgs(args: Array<string>): Promise<Request> {
    const cliArg = _parseArguments(args)
    let body: Buffer | undefined
    if (cliArg.magicParameters.body) {
        if (!process.stdin.isTTY) { // pipe input
            throw new Error('@body cannot be specified when Pipe input is present')
        }
        body = await fs.promises.readFile(resolveHomePath(cliArg.magicParameters.body))
    } else if (!process.stdin.isTTY) { // pipe input
        body = await readStdinAsBuffer()
    }

    return {
        method: cliArg.method,
        path: cliArg.path,
        headers: cliArg.headers,
        queryParameters: cliArg.queryParameters,
        body,
    }
}

function writeBufferToStdout(buffer: Buffer | string): Promise<null> {
    const bufferString = buffer.toString('utf8')
    return new Promise((resolve, reject) => {
        process.stdout.write(bufferString, (err) => {
            if (!err) {
                resolve(null)
            } else {
                reject(err)
            }
        })
    })
}

/**
 * An interceptor for JSON request. It just adds Accept: application/json, and Content-Type: application/json
 */
export function injectHeadersForJsonRequest(performRequest: PerformRequest, request: Request): Promise<Response> {
    updateKeyValue(request.headers, 'Accept', 'application/json')
    updateKeyValue(request.headers, 'Content-Type', 'application/json')
    return performRequest(request)
}

export const executeRequest = _executeRequest

export const printResponseBody = writeBufferToStdout
/**
 * Perform HTTP request using input command line args.
 * baseURL and interceptors can be specified as context.
 * Interceptor enables us to add extra HTTP Headers (such as UserAgent, Authorization), logging, and so on.
 *
 * @param args Typically `process.argv.slice(2)`
 * @param context
 */
export async function createJSONClient(args: Array<string>, context: RequestContext) {
    const request = await buildRequestFromArgs(args)
    const response = await _executeRequest(request, context)

    if (!!response.body) {
        await writeBufferToStdout(response.body)
    }
}
