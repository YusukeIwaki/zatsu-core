import { equal } from 'assert'
import { updateKeyValue } from './util'

test('replace with string and value', () => {
    const target: Array<[string, number]> = [["key1", 10], ["Key2", 20], ["key3", 30]]
    updateKeyValue(target, 'key1', 1000)
    expect(target[0]).toEqual(["key1", 1000]);
    expect(target[1]).toEqual(["Key2", 20]);
    expect(target[2]).toEqual(["key3", 30]);
    expect(target[3]).toBeUndefined()
})

test('add key/value when predicate does not match', () => {
    const target: Array<[string, number]> = [["key1", 10], ["Key2", 20], ["key3", 30]]
    updateKeyValue(target, 'key4', 1000)
    expect(target[0]).toEqual(["key1", 10]);
    expect(target[1]).toEqual(["Key2", 20]);
    expect(target[2]).toEqual(["key3", 30]);
    expect(target[3]).toEqual(["key4", 1000]);
})
