package dev.patientallison.sudoku

import kotlin.math.sqrt

// no need to assert that a number is an integer due to kotlin's more precise typing
fun isPositive(value: Int): Boolean {
    return value > 0
}

fun isPositiveSquare(value: Int): Boolean {
    if (!isPositive(value)) return false
    val root = sqrt(value.toDouble())
    return root == root.toInt().toDouble()
}
