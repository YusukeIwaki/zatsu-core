import fetch from 'node-fetch'

export type Request = {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
    path: string
    headers: Array<[string, string]>
    queryParameters: URLSearchParams
    body?: string | Buffer | undefined
}

export type Response = {
    status: number
    headers: Array<[string, string]>
    body: string | Buffer | undefined
}

export type PerformRequest = (request: Request) => Promise<Response>
export type Interceptor = (performRequest: PerformRequest, request: Request) => Promise<Response>

export type RequestContext = {
    baseURL: string
    interceptors: Array<Interceptor>
}

function validatedBaseUrlFor(baseURL: string) {
    const url = new URL(baseURL)
    // Delete #hash and ?query=xxx which are not suitable for baseURL.
    url.hash = ""
    url.search = ""

    if (!!url.pathname && url.pathname.endsWith('/')) {
        url.pathname = url.pathname.substring(0, url.pathname.length - 1)
    }
    return url.toString()
}

export async function executeRequest(request: Request, context: RequestContext): Promise<Response> {
    const baseURL = validatedBaseUrlFor(context.baseURL)

    async function executeRequestInternal(request: Request): Promise<Response> {
        const url = new URL(`${baseURL}${request.path}`)
        url.search = request.queryParameters.toString()

        const response = await fetch(url, {
            method: request.method,
            headers: request.headers,
            body: request.body,
        })
        return {
            status: response.status,
            headers: Array.from(response.headers.entries()),
            body: await response.buffer(),
        }
    }

    const wrapped = context.interceptors.reduce((performRequest: PerformRequest, interceptor) => (request: Request) => interceptor(performRequest, request), executeRequestInternal)
    return wrapped(request)
}
