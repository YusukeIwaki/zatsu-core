import { equal } from 'assert'
import { updateKeyValue } from './util'

test('replace with predicate and valueTranslator', () => {
    const target: Array<[string, number]> = [["key1", 10], ["Key2", 20], ["key3", 30]]
    updateKeyValue(target,
        (a: string) => a.startsWith('k'),
        (a: number) => a * a,
    )
    expect(target[0]).toEqual(["key1", 100]);
    expect(target[1]).toEqual(["Key2", 20]);
    expect(target[2]).toEqual(["key3", 900]);
})

test('replace with string and value', () => {
    const target: Array<[string, number]> = [["key1", 10], ["Key2", 20], ["key3", 30]]
    updateKeyValue(target, 'key1', 1000)
    expect(target[0]).toEqual(["key1", 1000]);
    expect(target[1]).toEqual(["Key2", 20]);
    expect(target[2]).toEqual(["key3", 30]);
})
