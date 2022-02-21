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
    /**
     * before/after hook.
     *
     * @example
     * const loggingInterceptor = (performRequest, req) => {
     *     // before hook
     *     console.log(req)
     *
     *     const resp = performRequest(req)
     *
     *     // after hook
     *     console.log(res)
     *
     *     // We must return response
     *     return resp
     * }
     *
     *
     * @example
     * const authInterceptor = (performRequest, req) => {
     *     // Load or fetch access token before request.
     *     let cachedAccessToken = getCachedAccessToken()
     *     let accessToken = cachedAccessToken || fetchAccessToken()
     *     if (!accessToken) throw new Error('Failed to auth')
     *
     *     // Set the access token into Authorization header.
     *     req.headers.push(['Authorization', `Bearer ${accessToken}`])
     *
     *     let resp = performRequest(req)
     *
     *     // Retry with refreshing access token.
     *     if (resp.status == 401) {
     *         cachedAccessToken = undefined
     *         accessToken = fetchAccessToken()
     *         if (!accessToken) throw new Error('Failed to auth')
     *
     *         // Replace existing Authorization header.
     *         for (let index = 0; index < request.headers.length; index++) {
     *             if (request.headers[index][0] == 'Authorization') {
     *                 request.headers.splice(index, 1, ['Authorization', `Bearer ${accessToken}`])
     *                 break
     *             }
     *         }
     *
     *         resp = performRequest(req)
     *     }
     *
     *     // Store access token if succeeded.
     *     if (resp.status < 300 && !cachedAccessToken) {
     *         cacheAccessToken(accessToken)
     *     }
     * }
     */
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
            redirect: 'manual',
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
