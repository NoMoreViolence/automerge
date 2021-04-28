function isObject(obj) {
  return typeof obj === 'object' && obj !== null
}

/**
 * Returns a shallow copy of the object `obj`. Faster than `Object.assign({}, obj)`.
 * https://jsperf.com/cloning-large-objects/1
 */
function copyObject(obj) {
  if (!isObject(obj)) return {}
  let copy = {}
  for (let key of Object.keys(obj)) {
    copy[key] = obj[key]
  }
  return copy
}

/**
 * Takes a string in the form that is used to identify operations (a counter concatenated
 * with an actor ID, separated by an `@` sign) and returns an object `{counter, actorId}`.
 */
function parseOpId(opId) {
  const match = /^(\d+)@(.*)$/.exec(opId || '')
  if (!match) {
    throw new RangeError(`Not a valid opId: ${opId}`)
  }
  return {counter: parseInt(match[1]), actorId: match[2]}
}

/**
 * Returns true if the two byte arrays contain the same data, false if not.
 */
function equalBytes(array1, array2) {
  if (!(array1 instanceof Uint8Array) || !(array2 instanceof Uint8Array)) {
    throw new TypeError('equalBytes can only compare Uint8Arrays')
  }
  if (array1.byteLength !== array2.byteLength) return false
  for (let i = 0; i < array1.byteLength; i++) {
    if (array1[i] !== array2[i]) return false
  }
  return true
}

/**
 * Appends a list edit operation (insert, update, remove) to an array of existing operations. If the
 * last existing operation can be extended (as a multi-op), we do that.
 */
function appendEdit(existingEdits, nextEdit) {
  if (existingEdits.length === 0) {
    existingEdits.push(nextEdit)
    return
  }

  let lastEdit = existingEdits[existingEdits.length - 1]
  if (lastEdit.action === 'insert' && nextEdit.action === 'insert' &&
      lastEdit.index === nextEdit.index - 1 &&
      lastEdit.value.type === 'value' && nextEdit.value.type === 'value') {
    lastEdit.action = 'multi-insert'
    lastEdit.values = [lastEdit.value.value, nextEdit.value.value]
    delete lastEdit.value

  } else if (lastEdit.action === 'multi-insert' && nextEdit.action === 'insert' &&
             lastEdit.index + lastEdit.values.length === nextEdit.index &&
             nextEdit.value.type === 'value') {
    lastEdit.values.push(nextEdit.value.value)

  } else if (lastEdit.action === 'remove' && nextEdit.action === 'remove' &&
             lastEdit.index === nextEdit.index) {
    lastEdit.count += nextEdit.count

  } else {
    existingEdits.push(nextEdit)
  }
}

module.exports = {
  isObject, copyObject, parseOpId, equalBytes, appendEdit
}
