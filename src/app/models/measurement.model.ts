/** Expected format of a measurement */
export interface Measurement {
    /** ID of the measurement's document in the measurements collection */
    id?: string
    /** Visual identifier for the measurement */
    name: string
    /** Abreviation of name to represent the measurement */
    unit: String
}
