package com.asr.grasp.objects;


public class ShareObject {
    /**
     * Object to pass reconstruction share information between the client and server
     */

    private int reconID;
    private String username;

    public void setReconID(int id){
        this.reconID = id;
    }

    public int getReconID() {
        return this.reconID;
    }

    public void setUsername(String username){
        this.username = username;
    }

    public String getUsername(){
        return this.username;
    }

}
