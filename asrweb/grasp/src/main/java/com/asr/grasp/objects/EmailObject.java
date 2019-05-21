package com.asr.grasp.objects;

/**
 * Allows you to send an email of a specific type.
 *
 * written by ariane @ 01/11/2018
 */
public class EmailObject {

    private String username;
    private String email;
    private int type;
    private String content;
    private String subject;

    public EmailObject(String username, String email, int type) {
        this.email = email;
        this.username = username;
        this.type = type;
    }

    public String getEmail() {
        return this.email;
    }

    public String getUsername() {
        return this.username;
    }

    public int getType() {
        return this.type;
    }

    public void setContent(String appUrl, String confirmationToken) {
        this.content = "Dear " + username + ", \n "
                + " Please confirm your email by clicking the following link: \n"
                + appUrl + " and adding in your confirmation token: " + confirmationToken + " \n"
                + " Cheers, \n The grasp team :) ";
        this.subject = "Email confirmation at GRASP";
    }

    public void setContentPasswordReset(String appUrl, String confirmationToken) {
        this.content = "Dear " + username + ", \n "
                + " Please reset your password clicking the following link: \n"
                + appUrl + " and adding in your confirmation token: " + confirmationToken + " \n"
                + " Cheers, \n The grasp team :) \n If this wasn't you, please get in contact with the people at GRASP.";
        this.subject = "Reset password at GRASP";
    }

    public void setContentError(String reconName, String errorMessage) {
        this.content = "Dear " + username + ", \n "
                + " Unfortunately your reconstruction " + reconName + " wasn't able to completed!\n"
                + " Some common errors include:\n"
                + " 1. Not being logged in;\n"
                + " 2. Running a marginal reconstruction before your joint reconstruction has completed (this means we haven't saved all the exent sequences yet); and\n"
                + " 3. Having an odd labelling format for your internal tree nodes.\n"
                + " Please try again, if you have this issue again, please send the GRASP team an email and "
                + "forward on the following error: \n"
                + "\t" + errorMessage + "\n"
                + " Also please attach your files you were trying to run as this will help us to diagnose the issue.\n"
                + " Note: there are a number of common errors that occur, for these, please visit: http://grasp.scmb.uq.edu.au/guide#errors-nav\n"
                + " Cheers, \n The grasp team :) ";
        this.subject = "Reconstruction not complete at GRASP";
    }

    public void setContent(String reconName) {
        this.content = "Dear " + username + ", \n "
                + " Yay your reconstruction " + reconName + " is now complete!\n"
                + " Go to your login page to access it. \n"
                + " Cheers, \n The grasp team :) ";
        this.subject = "Reconstruction complete at GRASP";
    }

    public String getContent() {
        return this.content;
    }

    public String getSubject() {
        return this.subject;
    }
}
