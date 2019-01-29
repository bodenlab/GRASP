package com.asr.grasp.validator;

import com.asr.grasp.objects.UserObject;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.ValidationUtils;

import org.springframework.validation.Validator;

@Component
public class UserValidator implements Validator {

    UserObject user;

    @Override
    public boolean supports(Class<?> aClass) {
        return UserObject.class.equals(aClass);
    }

    @Override
    public void validate(Object o, Errors errors) {
        ValidationUtils.rejectIfEmptyOrWhitespace(errors, "username", "user.username.empty");
        ValidationUtils.rejectIfEmptyOrWhitespace(errors, "email", "user.email.empty");

        user = (UserObject) o;

        if (user.getUsername().length() < 3 || user.getUsername().length() > 32)
            errors.rejectValue("username", "user.username.size");

        if (user.getEmail().length() < 3 || user.getEmail().length() > 32)
            errors.rejectValue("email", "user.email.size");

    }

}