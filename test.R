setwd("location of tar file") 

install.packages("ASR_1.0.tar.gz", repos = NULL, type = "source")

library(ASR)

data(asrStructure)
summary(asrStructure)

?plot_aln
plot_aln(asrStructure)
example(plot_aln)

?read_fasta
fasta_file <- system.file("extdata", "runASR_aln_full.fa", package="ASR")
read_fasta(NULL, aln_file = fasta_file)

?plot_distrib
plot_distrib(asrStructure)
example(plot_distrib)

?plot_logo
plot_logo(asrStructure)
example(plot_logo)

?plot_tree
plot_tree(asrStructure)
example(plot_tree)

?plot_subtree
plot_subtree(asrStructure, "N2")
example(plot_subtree)

example(get_subtree_sequences)
subSequences <- get_subtree_sequences(asrStructure, "N2")
plot_aln(asrStructure, sequences = subSequences)
