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
        return "form";
    }

    /**
     * Submit the asr form (documenting input details, i.e. aln and tree file, etc)
     *
     * @param asr               ASR object
     * @param bindingResult     Form result, indicating any input errors
     * @param model             com model
     * @return                  results html template
     */
    @RequestMapping(value="/performASR", method=RequestMethod.POST)
    public String performASR(@Valid @ModelAttribute("asrForm") ASR asr, BindingResult bindingResult, Model model) {
        if (bindingResult.hasErrors())
            return "form";

        model.addAttribute("label", asr.getLabel());
        model.addAttribute("alnFilepath", asr.getAlnFilepath().getOriginalFilename());
        model.addAttribute("treeFilepath", asr.getTreeFilepath().getOriginalFilename());

        // upload supplied files
        try {
            String uploadDir = "/Users/marnie/Documents/WebSessions/";
            File sessionDir = new File(uploadDir + sessionId);
            if (!sessionDir.exists())
                sessionDir.mkdir();
            asr.setSessionDir(sessionDir.getAbsolutePath() + "/");
            asr.getAlnFilepath().transferTo(new File(asr.getSessionDir() + asr.getAlnFilepath().getOriginalFilename()));
            asr.getTreeFilepath().transferTo(new File(asr.getSessionDir() + asr.getTreeFilepath().getOriginalFilename()));

            // TODO: push exceptions to error message on view...
            asr.runReconstruction();
        } catch (Exception e) {
            model.addAttribute("errorMessage", e.getMessage());
            return "form";
        }
        return "results";
    }
}
