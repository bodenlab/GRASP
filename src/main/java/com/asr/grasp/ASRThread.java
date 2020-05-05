package com.asr.grasp;

import com.asr.grasp.controller.ReconstructionController;
import com.asr.grasp.objects.ASRObject;

import com.asr.grasp.objects.UserObject;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;

public class ASRThread implements Runnable {

    private ASRObject asr = null;
    private String status = "running";
    private Logger logger = null;
    private String inference;
    private String node;
    private Boolean addNode;
    private UserObject owner;
    private final Thread thread;

    public ASRThread(ASRObject asr, String inference, String node, Boolean addNode, Logger logger, UserObject owner, ReconstructionController reconController) {
        this.asr = asr;
        this.logger = logger;
        this.inference = asr.getInferenceType();
        this.node = asr.getNodeLabel();
        this.addNode = addNode;
        this.asr.setInferenceType(inference);
        this.asr.setWorkingNodeLabel(node);
        this.asr.setNodeLabel(node);
        this.owner = owner;
        this.thread = new Thread(this, "ASR-" + System.nanoTime());
        thread.start();
    }

    public void run() {
        long start = System.currentTimeMillis();

        // run reconstruction

        try {
            runReconstruction();
            long delta = System.currentTimeMillis() - start;
            logger.log(Level.INFO, "SESS,, infer_type: " + asr.getInferenceType() + ", num_seqs: " + asr.getNumberSequences() +
                    ", num_bases: " + asr.getNumberBases() + ", num_ancestors: " + asr.getNumberAncestors() + ", num_deleted: " + asr.getNumberDeletedNodes() +
                    ", time_ms: " + delta + ", num_threads: " + asr.getNumberThreads());// + ", mem_bytes: " + ObjectSizeCalculator.getObjectSize(asr));*/
            if (addNode)
                asr.setNodeLabel(node);
            status = "done";

            // Set the owner ID to be the logged in user
        } catch (InterruptedException e) {
            asr.setNodeLabel(node);
            asr.setInferenceType(inference);
            Thread.currentThread().interrupt();
            logger.log(Level.WARNING, "Reconstruction was interrupted by user");
        } catch (Exception e) {
            String message = e.getMessage();

            if (message != null)
                logger.log(Level.SEVERE, "ERR, error: " + message);

            String[] splitMessage = message.split("(\\r|\\n|\\r\\n)+");


            StringBuilder formatted = new StringBuilder();

            for (String line :splitMessage) {
                formatted.append(line);
                formatted.append("<br>");

            }

            status ="error\t" + formatted;
        }

    }

    public String getStatus() {
        return status;
    }

    private void runReconstruction() throws InterruptedException, IOException {
        asr.runReconstruction();
    }

    public void interrupt(){
        thread.interrupt();
    }

}
