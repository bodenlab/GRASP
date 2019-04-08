package com.asr.grasp.controller;

import com.asr.grasp.objects.ASRObject;
import com.asr.grasp.objects.EmailObject;
import com.asr.grasp.objects.ReconstructionObject;
import com.asr.grasp.objects.UserObject;
import com.asr.grasp.utils.Defines;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.util.ArrayList;
import json.JSONObject;
import org.springframework.stereotype.Controller;

/**
 * A class that is out of the @session and @beans to allow saving when the connection
 * has been closed.
 * This takes takes the other controllers and keeps the instance alive until
 * everything has been saved. Then sends an email to the user to notify them that it has been
 * complete.
 *
 */
@Controller
public class SaveController implements Runnable {

    ReconstructionController reconController;
    SeqController seqController;
    EmailController emailController;
    UserController userController;
    TreeController treeController;

    private ReconstructionObject currRecon;
    private UserObject user;

    private ASRObject asr = null;
    private String inference;
    private String node;
    private UserObject owner;
    private Thread thread;
    private boolean runRecon; // Lets us know whether we need to run the reconstruction
    private boolean saveGappySeq;
    private boolean isSaving;

    /**
     * To allow us to have a saveController object in the main App.
     */
    public SaveController() {
        isSaving = false;
    }


    /**
     * Here we have to pass all the instanciated classes from the main GraspApplication class.
     * This is done as it is running on a separate thread. As each of the controllers are injected
     * properties, if we don't do this, a new instance will be created and we'll get null pointer
     * exceptions.
     *
     * @param reconController
     * @param currRecon
     * @param userController
     * @param user
     * @param emailController
     * @param seqController
     * @param treeController
     * @param saveGappySeq
     */
    public SaveController(ReconstructionController reconController, ReconstructionObject currRecon,
            UserController userController, UserObject user, EmailController emailController,
            SeqController seqController, TreeController treeController, boolean saveGappySeq, boolean isSaving) {
        /* Set the following for the emailing and saving */
        this.reconController = reconController;
        this.seqController = seqController;
        this.emailController = emailController;
        this.userController = userController;
        this.currRecon = currRecon;
        this.user = user;
        this.saveGappySeq = saveGappySeq;
        this.treeController = treeController;
        this.isSaving = isSaving;
    }

    /**
     * Here is a separate initialisation, if the user is running a reconstruction - not just saving
     * it.
     * For this we need to set up the reconstruction and wait for that to complete before
     * continuing and saving the joint reconstructions.
     *
     * @param asr
     */
    public void initialiseForReconstruction(ASRObject asr) {
        this.asr = asr;
        this.inference = asr.getInferenceType();
        this.node = asr.getNodeLabel();
        this.asr.setInferenceType(inference);
        this.asr.setWorkingNodeLabel(node);
        this.asr.setNodeLabel(node);
        this.owner = user;
        this.runRecon = true;
    }

    /**
     * Helper function to set the current reconstruction.
     */
    public void setReconFromASR(ASRObject asr) {
        JSONObject ancestor = asr.getAncestralGraphJSON(asr.getWorkingNodeLabel());
        JSONObject msa = asr.getMSAGraphJSON();

        currRecon = reconController.createFromASR(asr);

        // Set the anscestor and the msa
        currRecon.setAncestor(ancestor.toString());
        currRecon.setMsa(msa.toString());

        // Set the owner ID to be the logged in user
        currRecon.setOwnerId(user.getId());

        // Set the current reconstruction of the owner to be this reconstruction
        userController.setCurrRecon(currRecon, user);
    }


    /**
     * The run method of the thread saves the Joint Reconstructions to the database.
     * Optionally it also performs the reconstruction.
     *
     */
    @Override
    public void run() {
        try {
            if (runRecon) {
                asr.runReconstruction();
            }
            setReconFromASR(asr);

            // Now we want to save the reconstruction
            reconController.save(user, currRecon);

            // Now we want to save the sequences
            seqController.insertAllExtantsToDb(currRecon.getId(), asr.getSequencesAsNamedMap(), saveGappySeq);
            System.out.println("Saving the reconstruction complete, now creating all the joints");
            // Start saving the joint reconstruction, this is the component that takes the longest
            if (user.getUsername().equals("dev")) {
                /**
                 * Here we want to just save the top 20 for each --> otherwise we have to re-do
                 * it each time.
                 */

                String[] ancsOfInterest = {"N1", "N423", "N560"};
                System.out.println("Saving the nodes that are similar: ");
                ArrayList<String> nodeLabels = new ArrayList<>();
                for (String nl: ancsOfInterest) {
                    //ArrayList<String> similarLabels = treeController.getSimilarNodesTmp(user, "base_dataset_mini", currRecon.getLabel(), nl, 3);

                    ArrayList<String> similarLabels = treeController.getSimilarNodesTmp(user, "sp_cured_3_01112018", currRecon.getLabel(), nl, 5);
                    /**
                     * Don't want to add dups.
                     */
                    System.out.println("Running Node: " + nl);
                    for (String i: similarLabels) {
                        if (!nodeLabels.contains(i)) {
                            nodeLabels.add(i);
                            System.out.print(i + ",     ");
                        }
                    }

                }

                seqController.insertSpecificJointsToDB(currRecon.getId(), asr.getASRPOG(Defines.JOINT),
                        saveGappySeq, nodeLabels, user.getId(), currRecon.getLabel());
            } else {
                seqController.insertAllJointsToDb(currRecon.getId(), asr.getASRPOG(Defines.JOINT),
                        saveGappySeq, user.getId());
            }
            // Now we want to send an email notifying the user that their reconstruction is complete
            EmailObject email = new EmailObject(user.getUsername(), user.getEmail(), Defines.RECONSTRUCTION);
            email.setContent(currRecon.getLabel());
            emailController.sendEmail(email);
            isSaving = false;
        } catch (Exception e) {
            try {
                // Now we want to send an email notifying the user that their reconstruction is complete
                EmailObject email = new EmailObject(user.getUsername(), user.getEmail(),
                        Defines.RECONSTRUCTION);
                email.setContentError(currRecon.getLabel(), e.getMessage());
                emailController.sendEmail(email);
            } catch (Exception e2) {
                System.out.println("Couldn't send the error email: " + e2);
            }
            System.out.println("Couldn't run the saving thread: " + e);
            isSaving = false;
        }

        // Set asr & all other variables to null so that GC knows to clean this up.
        asr = null;
        reconController = null;
        seqController = null;
        emailController = null;
        userController = null;
        treeController = null;
        currRecon = null;
        inference = null;
        isSaving = false;
    }

    /**
     * Gets whether we are currently saving a reconstruction or not.
     * @return
     */
    public boolean getIsSaving() {
        return isSaving;
    }


    /**
     * Start the thread.
     */
    public void start () {
        if (thread == null) {
            thread = new Thread (this);
            thread.start ();
        }
    }
}
