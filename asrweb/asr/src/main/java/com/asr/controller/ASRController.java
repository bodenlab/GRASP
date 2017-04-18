package com.asr.controller;

import com.ASR;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.validation.Valid;

/**
 * Created by marnie on 11/4/17.
 */
@Controller
@RequestMapping(value = "/asr")
class ASRController {

    /**
     * Get form.html template
     *
     * @return          form html template
     */
    @RequestMapping(method=RequestMethod.GET)
    public String showForm(Model model) {
        model.addAttribute("asr", new ASR());
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
    public String performASR(@Valid @ModelAttribute("asr") ASR asr, BindingResult bindingResult, Model model) {
        if (bindingResult.hasErrors())
            return showForm(model);

        model.addAttribute("label", asr.getLabel());
        model.addAttribute("alnFilepath", asr.getAlnFilepath());
        model.addAttribute("treeFilepath", asr.getTreeFilepath());

        return "results";
    }

    @RequestMapping(value="/performASR", method=RequestMethod.GET)
    public String performASR(Model model, BindingResult bindingResult) {
        if (bindingResult.hasErrors())
            return showForm(model);

        return "results";
    }
}
