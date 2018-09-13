# Utils 
Utils contains the source and resources of components which aid GRASP. These 
include other database's such as the downloaded NCBI taxonomy information 
which is accessed from:
 ftp://ftp.ncbi.nlm.nih.gov/pub/taxonomy/accession2taxid/ 

Further, the taxonomy information was taken from: https://gitlab.com/zyxue/ncbitax2lin-lineages/blob/master/lineages-2018-06-13.csv.gz
where the taxonomic information from NCBI has been compiled.

From the combined taxonomic information we retain:
`tax_id,superkingdom,phylum,class,order,family,genus,species,cohort,forma,infraclass,infraorder,kingdom`


See NCBI's API information:
https://dataguide.nlm.nih.gov/eutilities/utilities.html