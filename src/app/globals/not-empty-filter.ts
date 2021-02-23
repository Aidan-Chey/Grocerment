/** Removes the possibility that a null or undefined is emitted */
function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
}

export default notEmpty;