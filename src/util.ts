export function updateKeyValue<T>(keyValueArray: Array<[string, T]>, targetKey: string, newValue: T) {
    // Scan and replace key-value pairs.
    let found = false
    for (let index = 0; index < keyValueArray.length; index++) {
        const [key, value] = keyValueArray[index];
        if (key == targetKey) {
            keyValueArray.splice(index, 1, [key, newValue])
            found = true
        }
    }
    if (!found) {
        keyValueArray.push([targetKey, newValue])
    }
}
