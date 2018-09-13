package com.asr.grasp.model;


/**
 * Generic object to store a value, a type and an index of where to
 * either insert of get a record from a column.
 *
 * Created by ariane on 13/07/18.
 */
public class ColumnEntry {

    int index;
    String label;
    int type;

    ColumnEntry(int index, String label, int type) {
        this.index = index;
        this.type = type;
        this.label = label;
    }

    String getLabel() {return this.label; }

    int getType() {return this.type; }

    int getIndex() {return this.index; }

}
