#' Function to load java packages for using the java classes
#' 
.onLoad <- function(libname, pkgname) {
  rJava::.jpackage(pkgname, jars="ASRPOG.jar", lib.loc = libname)
  attach(rJava::javaImport( c("java.lang", "java.io")))
}
