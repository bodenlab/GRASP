package com.asr.grasp.objects;


/**
 * A general object that stores the label and the id for an object.
 *
 * This means we can keep users usernames and ids i.e. for sharing
 * Similarly with Reconstructions a general object would have the username
 * (to show the user) and the ID which would be used internally.
 *
 * Created by ariane on 13/07/18.
 */
public class GeneralObject {

    public int id;
    public String label;
    public String size;
    public String updatedAt;
    public String error = "";

    public GeneralObject(int id, String label, String size, String updatedAt) {
        this.label = label;
        this.id = id;
        this.size = size;
        this.updatedAt = updatedAt;
    }

    public void setError(String error) { this.error = error; }

    public String getError() { return this.error; }

    public String getUpdatedAt() {
        return this.updatedAt;
    }

    public void setSize(String size) { this.size = size; }

    public String getSize() { return this.size; }

    public String getLabel() {
        return this.label;
    }

    public int getId() {
        return this.id;
    }
}
