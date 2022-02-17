import { parseArguments } from "./cli";

test('parse simple URL', () => {
    const result = parseArguments(['GET', '/current_user'])
    expect(result.method).toEqual('GET')
    expect(result.path).toEqual('/current_user')
    expect(result.headers).toHaveLength(0)
    expect(result.queryParameters.toString()).toEqual('')
    expect(result.magicParameters).toEqual({})
})

test('parse URL with query parameters', () => {
    const result = parseArguments(['GET', '/search?q=日本語&page=12'])
    expect(result.method).toEqual('GET')
    expect(result.path).toEqual('/search')
    expect(result.headers).toHaveLength(0)
    expect(result.queryParameters.toString()).toEqual(`q=${encodeURIComponent('日本語')}&page=12`)
    expect(result.magicParameters).toEqual({})
})

test('parse URL with query parameters and specified additional query parameter', () => {
    const result = parseArguments(['GET', '/search?q=日本語&page=12', 'hl=en'])
    expect(result.method).toEqual('GET')
    expect(result.path).toEqual('/search')
    expect(result.headers).toHaveLength(0)
    expect(result.queryParameters.toString()).toEqual(`q=${encodeURIComponent('日本語')}&page=12&hl=en`)
    expect(result.magicParameters).toEqual({})
})

test('parse additional query parameters', () => {
    const result = parseArguments(['GET', '/search', 'q=日本語', 'English'])
    expect(result.method).toEqual('GET')
    expect(result.path).toEqual('/search')
    expect(result.headers).toHaveLength(0)
    expect(result.queryParameters.toString()).toEqual(`q=${encodeURIComponent('日本語')}+English`)
    expect(result.magicParameters).toEqual({})
})

test('parse additional header', () => {
    const result = parseArguments(['GET', '/current_user', 'Authorization:', 'Bearer', 'xxxxxx', 'X-CUSTOM-ID:Custom', '1', '2', '3'])
    expect(result.method).toEqual('GET')
    expect(result.path).toEqual('/current_user')
    expect(result.headers).toEqual([['Authorization', 'Bearer xxxxxx'], ['X-CUSTOM-ID', 'Custom 1 2 3']])
    expect(result.queryParameters.toString()).toEqual('')
    expect(result.magicParameters).toEqual({})
})

test('parse @body', () => {
    const result = parseArguments(['PUT', '/current_user', '@body=form data.json'])
    expect(result.method).toEqual('PUT')
    expect(result.path).toEqual('/current_user')
    expect(result.headers).toHaveLength(0)
    expect(result.queryParameters.toString()).toEqual('')
    expect(result.magicParameters.body).toEqual('form data.json')

})
