[![Build Status](https://travis-ci.com/bodenlab/GRASP.svg?branch=tests)](https://travis-ci.com/bodenlab/GRASP)
[![License](https://badgen.net/github/license/bodenlab/GRASP)](https://github.com/bodenlab/GRASP/blob/master/LICENSE)
[![Uptime Robot status](https://img.shields.io/uptimerobot/ratio/m784016796-898fd6b81f5906d641c5f5d4?label=uptime%20%28last%2030%20days%29)](https://stats.uptimerobot.com/GYNrxi1n1Z)

<!-- [![Coverage Status](https://coveralls.io/repos/github/gabefoley/popchoose/badge.svg?branch=tests)](https://coveralls.io/github/gabefoley/popchoose?branch=tests) -->
<!-- [![Known Vulnerabilities](https://snyk.io/test/github/bodenlab/GRASP/badge.svg)](https://snyk.io/test/github/bodenlab/GRASP) -->

# GRASP
GRASP is a tool for performing ancestral sequence reconstruction.

GRASP is part of the [GRASP-suite](https://bodenlab.github.io/GRASP-suite) of tools for curating, performing, and analysing ancestral sequence reconstruction.

This is the repository for the web service / GUI version of GRASP.

## What does GRASP do?
The GRASP web service was developed to facilitate the steps of performing a reconstruction of ancestor sequences (represented by partial-order graphs) and the exploration, archival and sharing of the output. The service consists of three major parts: an inference engine bnkit written in Java, a web service backend written in Java using the Spring framework and Postgres, and web client functionality written in Javascript. The latter two are contained in the open source project GRASP. GRASP depends on the open source project [bnkit](https://github.com/bodenlab/bnkit) for performing phylogenetic inference.

## How do you use GRASP?
The GRASP web service incorporates a user guide that we recommend when you start out. You will find it in the menu at the top of the GRASP screen at all times.

Use any standard web browser and enter the URL http://grasp.scmb.uq.edu.au. We recommend that you sign up for an account; with an account you will be able to use a lot of features that otherwise are unavailable.

## What else?
There is a [command-line version](https://bodenlab.github.io/GRASP-suite/project/graspcmd/) to run reconstructions on your local hardware. This version does not have all the features; for instance there is no interactive mode and currently no way of transferring your reconstruction to the web service.


## Docker

GRASP is available through Docker Hub at `gabefoley/grasp`

Once you have docker installed you can


```console
docker run -it -v {full path to where your data is located}:/data gabefoley/grasp grasp -aln /data/{name of your alignment file}.aln -nwk /data/{name of your newick file}.nwk -out /data
```

for example, for me the command looks like (I have test_6.aln and test_6.nwk sitting in a /data folder):

```console
docker run -it -v /Users/coolusername/Documents/code/grasp/data:/data grasp-docker grasp -aln /data/test_6.aln -nwk /data/test_6.nwk -out /data
```

This should give you a file, GRASP_ancestors.fasta appearing in folder: `/Users/coolusername/Documents/code/grasp/data.`


## Resources

A paper that describes GRASP and its evaluation in detail is available as a [pre-print from bioRxiv](https://www.biorxiv.org/content/10.1101/2019.12.30.891457v1).

[bnkit - the code for performing inference within GRASP](https://github.com/bodenlab/bnkit)

[GRASP-suite - information about ancestral sequence reconstruction and a link to download the command line version of GRASP](https://bodenlab.github.io/GRASP-suite/)

[GRASP-resources - Supplementary material for the GRASP paper and Jupyter Notebooks for performing sequence curation](https://github.com/bodenlab/GRASP-resources)

Tutorials and material to support GRASP are available at [GRASP-resources](https://github.com/bodenlab/GRASP-resources)

## Development
Get in contact with the Boden lab; see http://bioinf.scmb.uq.edu.au or http://grasp.scmb.uq.edu.au.

