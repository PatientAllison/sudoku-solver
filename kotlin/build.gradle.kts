plugins {
    kotlin("jvm") version "2.3.20"
    application
    id("org.jlleitschuh.gradle.ktlint") version "12.3.0"
}

group = "dev.patientallison.sudoku"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    testImplementation(kotlin("test"))
}

kotlin {
    jvmToolchain(21)
}

tasks.test {
    useJUnitPlatform()
}

application {
    mainClass.set("dev.patientallison.sudoku.MainKt")
}
