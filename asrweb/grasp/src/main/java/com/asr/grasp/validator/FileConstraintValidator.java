package com.asr.grasp.validator;

import org.springframework.web.multipart.MultipartFile;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;

/**
 * Created by marnie on 19/4/17.
 */
public class FileConstraintValidator implements ConstraintValidator<File, MultipartFile> {

    private String expectedType;

    @Override
    public void initialize(File file) {
        expectedType = file.type();
    }

    @Override
    public boolean isValid(MultipartFile fileField, ConstraintValidatorContext ctxt) {
        if (fileField == null || fileField.getName().isEmpty())
            return false;

        System.out.println(fileField.getOriginalFilename());

        // do validity check
        if (expectedType.equalsIgnoreCase("aln"))
            return fileField.getOriginalFilename().endsWith(".aln");
        if (expectedType.equalsIgnoreCase("nwk"))
            return fileField.getOriginalFilename().endsWith(".nwk");
        if (expectedType.equalsIgnoreCase("seq"))
            return fileField.getOriginalFilename().endsWith(".fa") || fileField.getOriginalFilename().endsWith(".fasta") || fileField.getOriginalFilename().endsWith(".aln");

        return true;
    }
}
