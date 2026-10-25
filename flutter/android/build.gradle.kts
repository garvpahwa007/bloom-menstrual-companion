allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
    afterEvaluate {
        val androidExtension = extensions.findByName("android") ?: return@afterEvaluate
        val setCompileSdk = androidExtension.javaClass.methods.firstOrNull {
            (it.name == "setCompileSdk" || it.name == "setCompileSdkVersion") &&
                it.parameterTypes.contentEquals(arrayOf(Int::class.javaPrimitiveType))
        }
        setCompileSdk?.invoke(androidExtension, 36)
    }
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
