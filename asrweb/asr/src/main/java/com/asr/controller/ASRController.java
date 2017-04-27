package com.asr.controller;

import com.ASR;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.validation.Valid;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;

/**
 * Created by marnie on 11/4/17.
 */
@Controller
@RequestMapping(value = "/asr")
class ASRController {

    final String sessionId = "grasp" + Long.toString(System.currentTimeMillis());
    final String sessionPath = "/Users/marnie/Documents/WebSessions/";

    final String graphExample = "{\"poags\":{\"inferred\":{\"metadata\":{\"max_depth\":1,\"title\":\"Some title\"},\"nodes\":[{\"start\":0,\"x\":0,\"y\":0,\"end\":0,\"id\":0,\"label\":\"M\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[{\"x_label\":\"M\",\"value\":100}]},\"seq\":{\"chars\":[{\"label\":\"P\",\"value\":4},{\"label\":\"M\",\"value\":3}]}},{\"start\":1,\"x\":1,\"y\":0,\"end\":1,\"id\":2,\"label\":\"D\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[{\"x_label\":\"D\",\"value\":100}]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":2},{\"label\":\"D\",\"value\":14}]}},{\"start\":2,\"x\":2,\"y\":0,\"end\":2,\"id\":4,\"label\":\"A\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[{\"x_label\":\"A\",\"value\":7},{\"x_label\":\"S\",\"value\":90},{\"x_label\":\"T\",\"value\":5}]},\"seq\":{\"chars\":[{\"label\":\"A\",\"value\":1},{\"label\":\"S\",\"value\":13},{\"label\":\"T\",\"value\":1},{\"label\":\"V\",\"value\":2}]}},{\"start\":3,\"x\":3,\"y\":0,\"end\":3,\"id\":5,\"label\":\"T\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[{\"x_label\":\"I\",\"value\":60},{\"x_label\":\"M\",\"value\":30},{\"x_label\":\"T\",\"value\":10}]},\"seq\":{\"chars\":[{\"label\":\"T\",\"value\":2},{\"label\":\"V\",\"value\":1},{\"label\":\"I\",\"value\":9},{\"label\":\"M\",\"value\":5}]}},{\"start\":4,\"x\":4,\"y\":0,\"end\":4,\"id\":6,\"label\":\"S\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[{\"x_label\":\"N\",\"value\":100}]},\"seq\":{\"chars\":[{\"label\":\"A\",\"value\":2},{\"label\":\"S\",\"value\":4},{\"label\":\"D\",\"value\":1},{\"label\":\"E\",\"value\":6},{\"label\":\"N\",\"value\":8}]}},{\"start\":5,\"x\":5,\"y\":0,\"end\":5,\"id\":7,\"label\":\"F\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[{\"x_label\":\"F\",\"value\":100}]},\"seq\":{\"chars\":[{\"label\":\"F\",\"value\":20}]}},{\"start\":6,\"x\":6,\"y\":0,\"end\":6,\"id\":8,\"label\":\"L\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[{\"x_label\":\"L\",\"value\":100}]},\"seq\":{\"chars\":[{\"label\":\"F\",\"value\":13},{\"label\":\"L\",\"value\":8}]}},{\"start\":7,\"x\":7,\"y\":0,\"end\":7,\"id\":9,\"label\":\"K\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[{\"x_label\":\"K\",\"value\":100}]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":2},{\"label\":\"R\",\"value\":3},{\"label\":\"S\",\"value\":1},{\"label\":\"T\",\"value\":2},{\"label\":\"E\",\"value\":1},{\"label\":\"K\",\"value\":11}]}},{\"start\":8,\"x\":8,\"y\":0,\"end\":8,\"id\":10,\"label\":\"K\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[{\"x_label\":\"K\",\"value\":100}]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":1},{\"label\":\"K\",\"value\":18},{\"label\":\"N\",\"value\":2}]}},{\"start\":9,\"x\":9,\"y\":0,\"end\":9,\"id\":11,\"label\":\"F\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[{\"x_label\":\"S\",\"value\":100}]},\"seq\":{\"chars\":[{\"label\":\"S\",\"value\":9},{\"label\":\"F\",\"value\":10}]}},{\"start\":10,\"x\":10,\"y\":0,\"end\":10,\"id\":12,\"label\":\"V\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[{\"x_label\":\"V\",\"value\":100}]},\"seq\":{\"chars\":[{\"label\":\"V\",\"value\":19},{\"label\":\"I\",\"value\":3}]}},{\"start\":11,\"x\":11,\"y\":0,\"end\":11,\"id\":13,\"label\":\"K\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[{\"x_label\":\"K\",\"value\":100}]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":1},{\"label\":\"D\",\"value\":4},{\"label\":\"E\",\"value\":1},{\"label\":\"H\",\"value\":1},{\"label\":\"Y\",\"value\":3},{\"label\":\"K\",\"value\":9},{\"label\":\"N\",\"value\":3}]}},{\"start\":12,\"x\":12,\"y\":0,\"end\":12,\"id\":15,\"label\":\"I\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[{\"x_label\":\"M\",\"value\":100}]},\"seq\":{\"chars\":[{\"label\":\"T\",\"value\":1},{\"label\":\"I\",\"value\":5},{\"label\":\"M\",\"value\":16}]}},{\"start\":13,\"x\":13,\"y\":1,\"end\":13,\"id\":16,\"label\":\"K\",\"class\":\"\",\"lane\":1,\"graph\":{\"bars\":[{\"x_label\":\"K\",\"value\":100}]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":1},{\"label\":\"T\",\"value\":1},{\"label\":\"K\",\"value\":18}]}},{\"start\":14,\"x\":14,\"y\":1,\"end\":14,\"id\":17,\"label\":\"E\",\"class\":\"\",\"lane\":1,\"graph\":{\"bars\":[{\"x_label\":\"E\",\"value\":100}]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":1},{\"label\":\"E\",\"value\":13},{\"label\":\"K\",\"value\":6}]}},{\"start\":15,\"x\":15,\"y\":1,\"end\":15,\"id\":18,\"label\":\"G\",\"class\":\"\",\"lane\":1,\"graph\":{\"bars\":[{\"x_label\":\"S\",\"value\":100}]},\"seq\":{\"chars\":[{\"label\":\"S\",\"value\":8},{\"label\":\"T\",\"value\":4},{\"label\":\"G\",\"value\":2},{\"label\":\"N\",\"value\":1}]}},{\"start\":16,\"x\":16,\"y\":1,\"end\":16,\"id\":19,\"label\":\"R\",\"class\":\"\",\"lane\":1,\"graph\":{\"bars\":[{\"x_label\":\"R\",\"value\":100}]},\"seq\":{\"chars\":[{\"label\":\"R\",\"value\":15}]}},{\"start\":17,\"x\":17,\"y\":0,\"end\":17,\"id\":20,\"label\":\"L\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[{\"x_label\":\"L\",\"value\":100}]},\"seq\":{\"chars\":[{\"label\":\"L\",\"value\":17}]}},{\"start\":18,\"x\":18,\"y\":0,\"end\":18,\"id\":21,\"label\":\"K\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[{\"x_label\":\"D\",\"value\":8},{\"x_label\":\"E\",\"value\":2},{\"x_label\":\"H\",\"value\":30},{\"x_label\":\"K\",\"value\":8},{\"x_label\":\"N\",\"value\":3},{\"x_label\":\"Q\",\"value\":50}]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":1},{\"label\":\"A\",\"value\":2},{\"label\":\"D\",\"value\":6},{\"label\":\"H\",\"value\":1},{\"label\":\"K\",\"value\":1}]}}],\"edges\":{\"edges_19:20\":{\"y1\":1,\"x1\":16,\"y2\":0,\"weight\":50,\"from\":19,\"x2\":17,\"to\":20},\"edges_15:16\":{\"y1\":0,\"x1\":12,\"y2\":1,\"weight\":90,\"from\":15,\"x2\":13,\"to\":16},\"edges_16:17\":{\"y1\":1,\"x1\":13,\"y2\":1,\"weight\":90,\"from\":16,\"x2\":14,\"to\":17},\"edges_17:18\":{\"y1\":1,\"x1\":14,\"y2\":1,\"weight\":68,\"from\":17,\"x2\":15,\"to\":18},\"edges_18:19\":{\"y1\":1,\"x1\":15,\"y2\":1,\"weight\":68,\"from\":18,\"x2\":16,\"to\":19},\"edges_0:2\":{\"y1\":0,\"x1\":0,\"y2\":0,\"weight\":27,\"from\":0,\"x2\":1,\"to\":2},\"edges_10:11\":{\"y1\":0,\"x1\":8,\"y2\":0,\"weight\":81,\"from\":10,\"x2\":9,\"to\":11},\"edges_11:12\":{\"y1\":0,\"x1\":9,\"y2\":0,\"weight\":86,\"from\":11,\"x2\":10,\"to\":12},\"edges_13:15\":{\"y1\":0,\"x1\":11,\"y2\":0,\"weight\":100,\"from\":13,\"x2\":12,\"to\":15},\"edges_10:12\":{\"y1\":0,\"x1\":8,\"y2\":0,\"weight\":13,\"from\":10,\"x2\":10,\"to\":12},\"edges_12:13\":{\"y1\":0,\"x1\":10,\"y2\":0,\"weight\":100,\"from\":12,\"x2\":11,\"to\":13},\"edges_2:4\":{\"y1\":0,\"x1\":1,\"y2\":0,\"weight\":72,\"from\":2,\"x2\":2,\"to\":4},\"edges_15:20\":{\"y1\":0,\"x1\":12,\"y2\":0,\"weight\":9,\"from\":15,\"x2\":17,\"to\":20},\"edges_17:20\":{\"y1\":1,\"x1\":14,\"y2\":0,\"weight\":18,\"from\":17,\"x2\":17,\"to\":20},\"edges_4:5\":{\"y1\":0,\"x1\":2,\"y2\":0,\"weight\":77,\"from\":4,\"x2\":3,\"to\":5},\"edges_20:21\":{\"y1\":0,\"x1\":17,\"y2\":0,\"weight\":50,\"from\":20,\"x2\":18,\"to\":21},\"edges_5:6\":{\"y1\":0,\"x1\":3,\"y2\":0,\"weight\":77,\"from\":5,\"x2\":4,\"to\":6},\"edges_6:7\":{\"y1\":0,\"x1\":4,\"y2\":0,\"weight\":90,\"from\":6,\"x2\":5,\"to\":7},\"edges_6:9\":{\"y1\":0,\"x1\":4,\"y2\":0,\"weight\":4,\"from\":6,\"x2\":7,\"to\":9},\"edges_7:8\":{\"y1\":0,\"x1\":5,\"y2\":0,\"weight\":90,\"from\":7,\"x2\":6,\"to\":8},\"edges_8:11\":{\"y1\":0,\"x1\":6,\"y2\":0,\"weight\":4,\"from\":8,\"x2\":9,\"to\":11},\"edges_8:9\":{\"y1\":0,\"x1\":6,\"y2\":0,\"weight\":86,\"from\":8,\"x2\":7,\"to\":9},\"edges_8:10\":{\"y1\":0,\"x1\":6,\"y2\":0,\"weight\":4,\"from\":8,\"x2\":8,\"to\":10},\"edges_9:10\":{\"y1\":0,\"x1\":7,\"y2\":0,\"weight\":90,\"from\":9,\"x2\":8,\"to\":10}}}, \"msa\":{\"metadata\":{\"max_depth\":1,\"title\":\"Some title\"},\"nodes\":[{\"start\":0,\"x\":0,\"y\":0,\"end\":0,\"id\":0,\"label\":\"K\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"K\",\"value\":4}]}},{\"start\":1,\"x\":1,\"y\":0,\"end\":1,\"id\":2,\"label\":\"D\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":2},{\"label\":\"D\",\"value\":14}]}},{\"start\":2,\"x\":2,\"y\":0,\"end\":2,\"id\":4,\"label\":\"A\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"A\",\"value\":1},{\"label\":\"S\",\"value\":13},{\"label\":\"T\",\"value\":1},{\"label\":\"V\",\"value\":2}]}},{\"start\":3,\"x\":3,\"y\":0,\"end\":3,\"id\":5,\"label\":\"T\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"T\",\"value\":2},{\"label\":\"V\",\"value\":1},{\"label\":\"I\",\"value\":9},{\"label\":\"M\",\"value\":5}]}},{\"start\":4,\"x\":4,\"y\":0,\"end\":4,\"id\":6,\"label\":\"S\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"A\",\"value\":2},{\"label\":\"S\",\"value\":4},{\"label\":\"D\",\"value\":1},{\"label\":\"E\",\"value\":6},{\"label\":\"N\",\"value\":8}]}},{\"start\":5,\"x\":5,\"y\":0,\"end\":5,\"id\":7,\"label\":\"F\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"F\",\"value\":20}]}},{\"start\":6,\"x\":6,\"y\":0,\"end\":6,\"id\":8,\"label\":\"L\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"F\",\"value\":13},{\"label\":\"L\",\"value\":8}]}},{\"start\":7,\"x\":7,\"y\":0,\"end\":7,\"id\":9,\"label\":\"K\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":2},{\"label\":\"R\",\"value\":3},{\"label\":\"S\",\"value\":1},{\"label\":\"T\",\"value\":2},{\"label\":\"E\",\"value\":1},{\"label\":\"K\",\"value\":11}]}},{\"start\":8,\"x\":8,\"y\":0,\"end\":8,\"id\":10,\"label\":\"K\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":1},{\"label\":\"K\",\"value\":18},{\"label\":\"N\",\"value\":2}]}},{\"start\":9,\"x\":9,\"y\":0,\"end\":9,\"id\":11,\"label\":\"F\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"S\",\"value\":9},{\"label\":\"F\",\"value\":10}]}},{\"start\":10,\"x\":10,\"y\":0,\"end\":10,\"id\":12,\"label\":\"V\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"V\",\"value\":19},{\"label\":\"I\",\"value\":3}]}},{\"start\":11,\"x\":11,\"y\":0,\"end\":11,\"id\":13,\"label\":\"K\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":1},{\"label\":\"D\",\"value\":4},{\"label\":\"E\",\"value\":1},{\"label\":\"H\",\"value\":1},{\"label\":\"Y\",\"value\":3},{\"label\":\"K\",\"value\":9},{\"label\":\"N\",\"value\":3}]}},{\"start\":12,\"x\":12,\"y\":1,\"end\":12,\"id\":14,\"label\":\"Q\",\"class\":\"\",\"lane\":1,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":1},{\"label\":\"R\",\"value\":3}]}},{\"start\":13,\"x\":13,\"y\":0,\"end\":13,\"id\":15,\"label\":\"I\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"T\",\"value\":1},{\"label\":\"I\",\"value\":5},{\"label\":\"M\",\"value\":16}]}},{\"start\":14,\"x\":14,\"y\":1,\"end\":14,\"id\":16,\"label\":\"K\",\"class\":\"\",\"lane\":1,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":1},{\"label\":\"T\",\"value\":1},{\"label\":\"K\",\"value\":18}]}},{\"start\":15,\"x\":15,\"y\":1,\"end\":15,\"id\":17,\"label\":\"E\",\"class\":\"\",\"lane\":1,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":1},{\"label\":\"E\",\"value\":13},{\"label\":\"K\",\"value\":6}]}},{\"start\":16,\"x\":16,\"y\":1,\"end\":16,\"id\":18,\"label\":\"G\",\"class\":\"\",\"lane\":1,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"S\",\"value\":8},{\"label\":\"T\",\"value\":4},{\"label\":\"G\",\"value\":2},{\"label\":\"N\",\"value\":1}]}},{\"start\":17,\"x\":17,\"y\":1,\"end\":17,\"id\":19,\"label\":\"R\",\"class\":\"\",\"lane\":1,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"R\",\"value\":15}]}},{\"start\":18,\"x\":18,\"y\":0,\"end\":18,\"id\":20,\"label\":\"L\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"L\",\"value\":17}]}},{\"start\":19,\"x\":19,\"y\":0,\"end\":19,\"id\":21,\"label\":\"K\",\"class\":\"\",\"lane\":0,\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":1},{\"label\":\"A\",\"value\":2},{\"label\":\"D\",\"value\":6},{\"label\":\"H\",\"value\":1},{\"label\":\"K\",\"value\":1}]}}],\"edges\":{\"edges_19:20\":{\"y1\":1,\"x1\":17,\"y2\":0,\"weight\":50,\"from\":19,\"x2\":18,\"to\":20},\"edges_15:16\":{\"y1\":0,\"x1\":13,\"y2\":1,\"weight\":90,\"from\":15,\"x2\":14,\"to\":16},\"edges_17:18\":{\"y1\":1,\"x1\":15,\"y2\":1,\"weight\":68,\"from\":17,\"x2\":16,\"to\":18},\"edges_11:12\":{\"y1\":0,\"x1\":9,\"y2\":0,\"weight\":86,\"from\":11,\"x2\":10,\"to\":12},\"edges_13:15\":{\"y1\":0,\"x1\":11,\"y2\":0,\"weight\":81,\"from\":13,\"x2\":13,\"to\":15},\"edges_13:14\":{\"y1\":0,\"x1\":11,\"y2\":1,\"weight\":18,\"from\":13,\"x2\":12,\"to\":14},\"edges_8:11\":{\"y1\":0,\"x1\":6,\"y2\":0,\"weight\":4,\"from\":8,\"x2\":9,\"to\":11},\"edges_8:10\":{\"y1\":0,\"x1\":6,\"y2\":0,\"weight\":4,\"from\":8,\"x2\":8,\"to\":10},\"edges_14:15\":{\"y1\":1,\"x1\":12,\"y2\":0,\"weight\":18,\"from\":14,\"x2\":13,\"to\":15},\"edges_16:17\":{\"y1\":1,\"x1\":14,\"y2\":1,\"weight\":90,\"from\":16,\"x2\":15,\"to\":17},\"edges_18:19\":{\"y1\":1,\"x1\":16,\"y2\":1,\"weight\":68,\"from\":18,\"x2\":17,\"to\":19},\"edges_10:11\":{\"y1\":0,\"x1\":8,\"y2\":0,\"weight\":81,\"from\":10,\"x2\":9,\"to\":11},\"edges_10:12\":{\"y1\":0,\"x1\":8,\"y2\":0,\"weight\":13,\"from\":10,\"x2\":10,\"to\":12},\"edges_12:13\":{\"y1\":0,\"x1\":10,\"y2\":0,\"weight\":100,\"from\":12,\"x2\":11,\"to\":13},\"edges_1:2\":{\"y1\":0,\"x1\":0,\"y2\":0,\"weight\":18,\"from\":0,\"x2\":1,\"to\":2},\"edges_2:4\":{\"y1\":0,\"x1\":1,\"y2\":0,\"weight\":72,\"from\":2,\"x2\":2,\"to\":4},\"edges_15:20\":{\"y1\":0,\"x1\":13,\"y2\":0,\"weight\":9,\"from\":15,\"x2\":18,\"to\":20},\"edges_17:20\":{\"y1\":1,\"x1\":15,\"y2\":0,\"weight\":18,\"from\":17,\"x2\":18,\"to\":20},\"edges_4:5\":{\"y1\":0,\"x1\":2,\"y2\":0,\"weight\":77,\"from\":4,\"x2\":3,\"to\":5},\"edges_20:21\":{\"y1\":0,\"x1\":18,\"y2\":0,\"weight\":50,\"from\":20,\"x2\":19,\"to\":21},\"edges_5:6\":{\"y1\":0,\"x1\":3,\"y2\":0,\"weight\":77,\"from\":5,\"x2\":4,\"to\":6},\"edges_6:7\":{\"y1\":0,\"x1\":4,\"y2\":0,\"weight\":90,\"from\":6,\"x2\":5,\"to\":7},\"edges_6:9\":{\"y1\":0,\"x1\":4,\"y2\":0,\"weight\":4,\"from\":6,\"x2\":7,\"to\":9},\"edges_7:8\":{\"y1\":0,\"x1\":5,\"y2\":0,\"weight\":90,\"from\":7,\"x2\":6,\"to\":8},\"edges_8:9\":{\"y1\":0,\"x1\":6,\"y2\":0,\"weight\":86,\"from\":8,\"x2\":7,\"to\":9},\"edges_9:10\":{\"y1\":0,\"x1\":7,\"y2\":0,\"weight\":90,\"from\":9,\"x2\":8,\"to\":10}}}}}\n";

    /**
     * Get form.html template
     *
     * @return          form html template
     */
    @RequestMapping(method=RequestMethod.GET)
    public String showForm(Model model) {
        model.addAttribute("asrForm", new ASR());
        return "index";
    }

    /**
     * Submit the asr form (documenting input details, i.e. aln and tree file, etc)
     *
     * @param asr               ASR object
     * @param bindingResult     Form result, indicating any input errors
     * @param model             com model
     * @return                  index with results as attributes in the model
     */
    @RequestMapping(method=RequestMethod.POST, params="submit")
    public String performReconstruction(@Valid @ModelAttribute("asrForm") ASR asr, BindingResult bindingResult, Model model){
        System.out.println(bindingResult);
        if (bindingResult.hasErrors()) {
            for (String err : bindingResult.getSuppressedFields())
                System.out.println(err);
            return "index";
        }

        // upload supplied files
        try {
            File sessionDir = new File(sessionPath + sessionId);
            if (!sessionDir.exists())
                sessionDir.mkdir();

            asr.setSessionDir(sessionDir.getAbsolutePath() + "/");

            asr.getAlnFile().transferTo(new File(asr.getSessionDir() + asr.getAlnFile().getOriginalFilename()));
            asr.setAlnFilepath(asr.getSessionDir() + asr.getAlnFile().getOriginalFilename());
            asr.getTreeFile().transferTo(new File(asr.getSessionDir() + asr.getTreeFile().getOriginalFilename()));
            asr.setTreeFilepath(asr.getSessionDir() + asr.getTreeFile().getOriginalFilename());

            // TODO: push exceptions to error message on view...
            asr.runReconstruction();

            // add reconstructed newick string to send to javascript
            model.addAttribute("tree", asr.getReconstructedNewickString());

            // add ancestral graph
            model.addAttribute("graph", graphExample);
           // String msaGraph = asr.getMSAGraphJSON().toString());
            // String inferredGraph = asr.getAncestralGraphJSON("root").toString();

        } catch (Exception e) {
            model.addAttribute("errorMessage", e.getMessage());
            System.out.println("Error: " + e.getMessage());
            return "index";
        }

        // add attribute to specify to view results (i.e. to show the graph, tree, etc)
        model.addAttribute("inferenceType", asr.getInferenceType());
        model.addAttribute("results", true);

        return "index";
    }

    /**
     * Submit the asr form (documenting input details, i.e. aln and tree file, etc)
     *
     * @param asr               ASR object
     * @param model             com model
     * @return                  index with results as attributes in the model
     */
    @RequestMapping(method=RequestMethod.POST, params="test")
    public String performReconstruction(@ModelAttribute("asrForm") ASR asr, Model model){

        // upload supplied files
        try {
            File sessionDir = new File(sessionPath + sessionId);
            if (!sessionDir.exists())
                sessionDir.mkdir();

            asr.setSessionDir(sessionDir.getAbsolutePath() + "/");

            asr.setLabel("Test");
            asr.setInferenceType("marginal");
            // copy default data to user session folder

            File alnFile = new File(Thread.currentThread().getContextClassLoader().getResource("default.aln").toURI());
            asr.setAlnFilepath(asr.getSessionDir() + "default.aln");
            Files.copy(alnFile.toPath(), (new File(asr.getAlnFilepath())).toPath(), StandardCopyOption.REPLACE_EXISTING);
            File treeFile = new File(Thread.currentThread().getContextClassLoader().getResource("default.nwk").toURI());
            asr.setTreeFilepath(asr.getSessionDir() + "default.nwk");
            Files.copy(treeFile.toPath(), (new File(asr.getTreeFilepath())).toPath(), StandardCopyOption.REPLACE_EXISTING);

            // TODO: push exceptions to error message on view...
            asr.runReconstruction();

            // add reconstructed newick string to send to javascript
            model.addAttribute("tree", asr.getReconstructedNewickString());

            // add ancestral graph
            // String msaGraph = asr.getMSAGraphJSON().toString());
            // String inferredGraph = asr.getAncestralGraphJSON("root").toString();
            model.addAttribute("graph", graphExample);

        } catch (Exception e) {
            model.addAttribute("errorMessage", e.getMessage());
            System.out.println("Error: " + e.getMessage());
            return "index";
        }

        // add attribute to specify to view results (i.e. to show the graph, tree, etc)
        model.addAttribute("inferenceType", asr.getInferenceType());
        model.addAttribute("results", true);

        return "index";
    }
}
