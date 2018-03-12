package com.asr.grasp;

/**
 * Object to pass reconstruction share information between the client and server
 */
public class ShareObject {

    private Long reconID;
    private String username;

    public void setReconID(Long id){
        this.reconID = id;
    }

    public Long getReconID() {
        return this.reconID;
    }

    public void setUsername(String username){
        this.username = username;
    }

    public String getUsername(){
        return this.username;
    }
}
