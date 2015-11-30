# ASR

----------------------------------------
Download and install R 3.2.2

http://cran.us.r-project.org/ 

Mac and Windows – use precompiled binaries

Linux – use source code, untar, ./configure, make, make install, make check

----------------------------------------
Install RStudio

https://www.rstudio.com/products/rstudio/download/ 

----------------------------------------
Open RStudio and install required packages:

    install.packages(“ggplot2”)
    install.packages(“ape”)

----------------------------------------
Install ASR package

Session -> Set working directory -> Select location of ASR_x.x.x.tar.gz

    install.packages("ASR_x.x.x.tar.gz", repos = NULL, type = "source")

Common errors:

Wrong version of R - requires 3.2.2

Package dependencies (ape and ggplot2) are not installed

----------------------------------------
Load existing data

    data(asrStructure)

Use loaded data

    plot_aln(asrStructure)

Access help 

    ?plot_aln

Run examples

    examples(plot_aln)

----------------------------------------
Further examples of functions available in ASR can be found in test.R
