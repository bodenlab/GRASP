package com.asr.grasp.utils;

public class Defines {
    /**
     * Add in any defines that will be used accross the platform.
     */

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


    /**
     * Deletions / cleanup
     */
    public static final int NUM_MONTHS_OLD = 1;

    /**
     * Help for the taxa component
     */
    public static final String UNIPROT = "uniprot";
    public static final String NCBI = "ncbi";
    public static final String PDB = "pdb";
    public static final String[] SUPPORTED_PROT = {UNIPROT, NCBI};
}
