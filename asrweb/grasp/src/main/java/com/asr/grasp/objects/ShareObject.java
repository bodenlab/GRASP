package com.asr.grasp.objects;

/**
 * Object to pass reconstruction share information between the client and server.
 *
 * Created by marnie: 11/04/17
 */
public class ShareObject {

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
