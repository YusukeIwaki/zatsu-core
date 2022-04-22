type PredicateFunction<T> = (key: T) => boolean
type ValueTranslator<T> = (value: T) => T
export function updateKeyValue<T>(keyValueArray: Array<[string, T]>, predicate: string | PredicateFunction<string>, newValue: T | ValueTranslator<T>) {
    const keyPredicate = (typeof predicate === 'function') ? predicate as PredicateFunction<string> : (key: string) => key == predicate
    const valueTranslator = (typeof newValue === 'function') ? newValue as ValueTranslator<T> : (value: T) => newValue
    // Scan and replace key-value pairs.
    for (let index = 0; index < keyValueArray.length; index++) {
        const [key, value] = keyValueArray[index];
        if (keyPredicate(key)) {
            keyValueArray.splice(index, 1, [key, valueTranslator(value)])
        }
    }
}
