package com.asr.grasp.controller;

import java.util.HashSet;

public interface User {
    int getId();
    String getUsername();
    String register();
    HashSet<Integer> getOwnerAccessReconIds();
    HashSet<Integer> getMemberAccessReconIds();
}
