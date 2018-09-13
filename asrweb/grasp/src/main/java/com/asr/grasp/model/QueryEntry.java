package com.asr.grasp.model;

/**
 * Generic record class to store a value, a type and an index of where to
 * either insert of get a record from a model query.
 *
 * Created by ariane on 13/07/18.
 */
public class QueryEntry {

    int type;
    Object value;
    int index;

    public QueryEntry(int type, int index, Object value) {
        this.type = type;
        this.index = index;
        this.value = value;
    }
}
