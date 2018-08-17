package com.asr.grasp.db;

public class DbValue {
    /**
     * Generic record class to store a value, a type and an index of where to
     * either insert of get a record from a database query.
     */

    int type;
    Object value;
    int index;

    public DbValue(int type, int index, Object value) {
        this.type = type;
        this.index = index;
        this.value = value;
    }
}
}
