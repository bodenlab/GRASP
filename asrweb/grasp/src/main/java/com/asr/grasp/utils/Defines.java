package com.asr.grasp.utils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Add in any defines that will be used across the platform.
 */
public class Defines {

    /**
     * Add in used datatypes for the model.
     */
    public static final int INT = 1;
    public final static int STRING = 2;
    public final static int TIMESTAMP = 3;

    /**
     * Common
     */
    public static final int TRUE = 1;
    public static final int FALSE = -2;
    public static final int ERROR = -999;
    public static final int UNINIT = -2;

    /**
     * Access
     */
    public static final int MEMBER_ACCESS = 100;
    public static final int OWNER_ACCESS = 220;
    public static final int NO_ACCESS = -111;
    public static final int PUBLIC_USER = -23;


    /**
     * Deletions / cleanup
     */
    public static final int NUM_MONTHS_OLD = 1;

    /**
     * Help for the taxa component
     */
    public static final String UNIPROT = "uniprot";
    public static final String NCBI = "ncbi";
    public static final String ID_MAPPING = "id_mapping";
    public static final String PDB = "pdb";
    public static final String[] SUPPORTED_PROT = {UNIPROT, NCBI};

    /**
     * Help for the JOINT and MARGINAL tags in the database used
     * for saving the sequences.
     */
    public static final int MARGINAL = 0;
    public static final int JOINT = 1;
    public static final int ALL = 2;
    public static final int EXTANT = 3;
    public static final int ANCESTOR = 4;

    /**
     * ---------------------------------------------------------------------------------------------
     *
     * NOTE IF YOU CHANGE THE DEFINES BELOW YOU NEED TO ALSO CHANGE THE DEFINES FILE IN BNKIT &
     * ON THE FRONT END!
     *
     * ---------------------------------------------------------------------------------------------
     */
    /**
     * Defines for the Nodes in the MSA.
     *
     * Each position in an array corresponds to a particular value. An array as such is used
     * to save on space in the database and front end.
     */
    public static final int G_LABEL = 0;
    public static final int G_ID = 1;
    public static final int G_X = 2;
    public static final int G_MUTANTS = 3;
    public static final int G_CONSENSUS = 4;
    public static final int G_SEQ = 5;
    public static final int G_GRAPH = 6;

    // For sequence values
    public static final int G_VALUE = 1;

    // Where we place the characters in the sequence object / array
    public static final int G_CHAR = 0;

    /**
     * Defines for the Edges.
     */
    public static final int E_CONSENSUS = 0;
    public static final int E_RECIPROCATED = 1;
    public static final int E_FROM = 2;
    public static final int E_TO = 3;
    public static final int E_WEIGHT = 4;
    public static final int E_SINGLE = 5;

    /**
     * Email type
     */
    public static final int REGISTRATION = 0;
    public static final int RECONSTRUCTION = 1;
    public static final int FORGOT_PASSWORD = 2;

    /**
     * For the visualisation of the similar nodes.
     */
    public static final int S_NAME = 0;
    public static final int S_SCORE = 1;

    public static final List EXAMPLE_RECONSTRUCTIONS = Arrays.asList("Afriat-Jurnou", "CliftonandJackson", "Hudson", "CYP2U1");
}
