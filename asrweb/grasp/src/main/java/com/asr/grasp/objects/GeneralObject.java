package com.asr.grasp.objects;


public class GeneralObject {
/**
 * A general object that stores the label and the id for an object.
 *
 * This means we can keep users usernames and ids i.e. for sharing
 * Similarly with Reconstructions a general object would have the username
 * (to show the user) and the ID which would be used internally.
 *
 */
    public int id;
    public String label;

    public GeneralObject(int id, String label) {
        this.label = label;
        this.id = id;
    }

    public String getLabel() {
        return this.label;
    }

    public int getId() {
        return this.id;
    }
}
