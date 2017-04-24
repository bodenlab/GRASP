package com.asr.controller;

import com.ASR;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

import javax.validation.Valid;
import java.io.File;

/**
 * Created by marnie on 11/4/17.
 */
@Controller
@RequestMapping(value = "/asr")
class ASRController {

    final String sessionId = "grasp" + Long.toString(System.currentTimeMillis());

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
    @RequestMapping(method=RequestMethod.POST)
    public String performReconstruction(@Valid @ModelAttribute("asrForm") ASR asr, BindingResult bindingResult, Model model,
                                        @RequestParam(value="action", required=true) String action) {
        System.out.println(bindingResult);
        if (action.equalsIgnoreCase("submit") && bindingResult.hasErrors()) {
            for (String err : bindingResult.getSuppressedFields())
                System.out.println(err);
            return "index";
        }

        // upload supplied files
        try {
            String uploadDir = "/Users/marnie/Documents/WebSessions/";
            File sessionDir = new File(uploadDir + sessionId);
            if (!sessionDir.exists())
                sessionDir.mkdir();

            asr.setSessionDir(sessionDir.getAbsolutePath() + "/");

            if (action.equalsIgnoreCase("test")) {
                asr.setLabel("Test");
                asr.setInferenceType("marginal");
                asr.setAlnFilepath("/resources/data/default.aln");
                asr.setTreeFilepath("/resources/data/default.nwk");
            } else {
                asr.getAlnFile().transferTo(new File(asr.getSessionDir() + asr.getAlnFile().getOriginalFilename()));
                asr.setAlnFilepath(asr.getAlnFile().getOriginalFilename());
                asr.getTreeFile().transferTo(new File(asr.getSessionDir() + asr.getTreeFile().getOriginalFilename()));
                asr.setTreeFilepath(asr.getTreeFile().getOriginalFilename());
            }

            // TODO: push exceptions to error message on view...
            asr.runReconstruction();

            // add reconstructed newick string to send to javascript
            model.addAttribute("tree", asr.getReconstructedNewickString());

            // add ancestral graph
            String graph = "{\"nodes\":{\"node-1\":{\"x\":8,\"y\":0,\"label\":\"K\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"K\",\"value\":4}]}},\"node-2\":{\"x\":9,\"y\":0,\"label\":\"D\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":2},{\"label\":\"D\",\"value\":14}]}},\"node-15\":{\"x\":5,\"y\":0,\"label\":\"I\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"T\",\"value\":1},{\"label\":\"I\",\"value\":5},{\"label\":\"M\",\"value\":16}]}},\"node-4\":{\"x\":10,\"y\":0,\"label\":\"A\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"A\",\"value\":1},{\"label\":\"S\",\"value\":13},{\"label\":\"T\",\"value\":1},{\"label\":\"V\",\"value\":2}]}},\"node-14\":{\"x\":5,\"y\":1,\"label\":\"Q\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":1},{\"label\":\"R\",\"value\":3}]}},\"node-5\":{\"x\":11,\"y\":0,\"label\":\"T\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"T\",\"value\":2},{\"label\":\"V\",\"value\":1},{\"label\":\"I\",\"value\":9},{\"label\":\"M\",\"value\":5}]}},\"node-13\":{\"x\":4,\"y\":0,\"label\":\"K\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":1},{\"label\":\"D\",\"value\":4},{\"label\":\"E\",\"value\":1},{\"label\":\"H\",\"value\":1},{\"label\":\"Y\",\"value\":3},{\"label\":\"K\",\"value\":9},{\"label\":\"N\",\"value\":3}]}},\"node-6\":{\"x\":12,\"y\":0,\"label\":\"S\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"A\",\"value\":2},{\"label\":\"S\",\"value\":4},{\"label\":\"D\",\"value\":1},{\"label\":\"E\",\"value\":6},{\"label\":\"N\",\"value\":8}]}},\"node-12\":{\"x\":18,\"y\":0,\"label\":\"V\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"V\",\"value\":19},{\"label\":\"I\",\"value\":3}]}},\"node-7\":{\"x\":13,\"y\":0,\"label\":\"F\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"F\",\"value\":20}]}},\"node-11\":{\"x\":17,\"y\":0,\"label\":\"F\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"S\",\"value\":9},{\"label\":\"F\",\"value\":10}]}},\"node-8\":{\"x\":14,\"y\":0,\"label\":\"L\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"F\",\"value\":13},{\"label\":\"L\",\"value\":8}]}},\"node-10\":{\"x\":16,\"y\":0,\"label\":\"K\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":1},{\"label\":\"K\",\"value\":18},{\"label\":\"N\",\"value\":2}]}},\"node-21\":{\"x\":22,\"y\":0,\"label\":\"K\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":1},{\"label\":\"A\",\"value\":2},{\"label\":\"D\",\"value\":6},{\"label\":\"H\",\"value\":1},{\"label\":\"K\",\"value\":1}]}},\"node-9\":{\"x\":15,\"y\":0,\"label\":\"K\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":2},{\"label\":\"R\",\"value\":3},{\"label\":\"S\",\"value\":1},{\"label\":\"T\",\"value\":2},{\"label\":\"E\",\"value\":1},{\"label\":\"K\",\"value\":11}]}},\"node-20\":{\"x\":4,\"y\":0,\"label\":\"L\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"L\",\"value\":17}]}},\"node-19\":{\"x\":4,\"y\":1,\"label\":\"R\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"R\",\"value\":15}]}},\"node-18\":{\"x\":3,\"y\":1,\"label\":\"G\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"S\",\"value\":8},{\"label\":\"T\",\"value\":4},{\"label\":\"G\",\"value\":2},{\"label\":\"N\",\"value\":1}]}},\"node-17\":{\"x\":2,\"y\":1,\"label\":\"E\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":1},{\"label\":\"E\",\"value\":13},{\"label\":\"K\",\"value\":6}]}},\"node-16\":{\"x\":6,\"y\":1,\"label\":\"K\",\"graph\":{\"bars\":[]},\"seq\":{\"chars\":[{\"label\":\"Q\",\"value\":1},{\"label\":\"T\",\"value\":1},{\"label\":\"K\",\"value\":18}]}}},\"edges\":{\"edges_19:20\":{\"y1\":1,\"x1\":4,\"y2\":0,\"weight\":50,\"from\":19,\"x2\":4,\"to\":20},\"edges_15:16\":{\"y1\":0,\"x1\":5,\"y2\":1,\"weight\":90,\"from\":15,\"x2\":6,\"to\":16},\"edges_17:18\":{\"y1\":1,\"x1\":2,\"y2\":1,\"weight\":68,\"from\":17,\"x2\":3,\"to\":18},\"edges_11:12\":{\"y1\":0,\"x1\":17,\"y2\":0,\"weight\":86,\"from\":11,\"x2\":18,\"to\":12},\"edges_13:15\":{\"y1\":0,\"x1\":4,\"y2\":0,\"weight\":81,\"from\":13,\"x2\":5,\"to\":15},\"edges_13:14\":{\"y1\":0,\"x1\":4,\"y2\":1,\"weight\":18,\"from\":13,\"x2\":5,\"to\":14},\"edges_8:11\":{\"y1\":0,\"x1\":14,\"y2\":0,\"weight\":4,\"from\":8,\"x2\":17,\"to\":11},\"edges_8:10\":{\"y1\":0,\"x1\":14,\"y2\":0,\"weight\":4,\"from\":8,\"x2\":16,\"to\":10},\"edges_14:15\":{\"y1\":1,\"x1\":5,\"y2\":0,\"weight\":18,\"from\":14,\"x2\":5,\"to\":15},\"edges_16:17\":{\"y1\":1,\"x1\":6,\"y2\":1,\"weight\":90,\"from\":16,\"x2\":2,\"to\":17},\"edges_18:19\":{\"y1\":1,\"x1\":3,\"y2\":1,\"weight\":68,\"from\":18,\"x2\":4,\"to\":19},\"edges_10:11\":{\"y1\":0,\"x1\":16,\"y2\":0,\"weight\":81,\"from\":10,\"x2\":17,\"to\":11},\"edges_10:12\":{\"y1\":0,\"x1\":16,\"y2\":0,\"weight\":13,\"from\":10,\"x2\":18,\"to\":12},\"edges_12:13\":{\"y1\":0,\"x1\":18,\"y2\":0,\"weight\":100,\"from\":12,\"x2\":4,\"to\":13},\"edges_1:2\":{\"y1\":0,\"x1\":8,\"y2\":0,\"weight\":18,\"from\":1,\"x2\":9,\"to\":2},\"edges_2:4\":{\"y1\":0,\"x1\":9,\"y2\":0,\"weight\":72,\"from\":2,\"x2\":10,\"to\":4},\"edges_15:20\":{\"y1\":0,\"x1\":5,\"y2\":0,\"weight\":9,\"from\":15,\"x2\":4,\"to\":20},\"edges_17:20\":{\"y1\":1,\"x1\":2,\"y2\":0,\"weight\":18,\"from\":17,\"x2\":4,\"to\":20},\"edges_4:5\":{\"y1\":0,\"x1\":10,\"y2\":0,\"weight\":77,\"from\":4,\"x2\":11,\"to\":5},\"edges_20:21\":{\"y1\":0,\"x1\":4,\"y2\":0,\"weight\":50,\"from\":20,\"x2\":22,\"to\":21},\"edges_5:6\":{\"y1\":0,\"x1\":11,\"y2\":0,\"weight\":77,\"from\":5,\"x2\":12,\"to\":6},\"edges_6:7\":{\"y1\":0,\"x1\":12,\"y2\":0,\"weight\":90,\"from\":6,\"x2\":13,\"to\":7},\"edges_6:9\":{\"y1\":0,\"x1\":12,\"y2\":0,\"weight\":4,\"from\":6,\"x2\":15,\"to\":9},\"edges_7:8\":{\"y1\":0,\"x1\":13,\"y2\":0,\"weight\":90,\"from\":7,\"x2\":14,\"to\":8},\"edges_8:9\":{\"y1\":0,\"x1\":14,\"y2\":0,\"weight\":86,\"from\":8,\"x2\":15,\"to\":9},\"edges_9:10\":{\"y1\":0,\"x1\":15,\"y2\":0,\"weight\":90,\"from\":9,\"x2\":16,\"to\":10}}}";
            model.addAttribute("msagraph", graph);
            //System.out.println(asr.getMSAGraphJSON());

        } catch (Exception e) {
            model.addAttribute("errorMessage", e.getMessage());
            System.out.println("Error: " + e.getMessage());
            return "index";
        }

        // add attribute to specify to view results (i.e. to show the graph, tree, etc)
        model.addAttribute("results", true);

        return "index";
    }
}
