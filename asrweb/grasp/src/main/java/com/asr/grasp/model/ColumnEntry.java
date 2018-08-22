package com.asr.grasp.model;

import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.SessionScope;

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
