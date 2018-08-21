package com.asr.grasp.validator;

import com.asr.grasp.controller.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.ValidationUtils;
import org.springframework.validation.Validator;

@Component
public class LoginValidator implements Validator {
    @Autowired
    private User userService;

    @Override
    public boolean supports(Class<?> aClass) {
        return com.asr.grasp.User.class.equals(aClass);
    }

    @Override
    public void validate(Object o, Errors errors) {
        ValidationUtils.rejectIfEmptyOrWhitespace(errors, "username", "user.username.empty");
        ValidationUtils.rejectIfEmptyOrWhitespace(errors, "password", "user.password.empty");

        com.asr.grasp.User user = (com.asr.grasp.User) o;

        if (!userService.userExist(user.getUsername())) {
            errors.rejectValue("username", "user.username.nonexist");
        }
        // If the user's password was incorrect don't let them login and
        // return an error message.
        if (userService.getUserAccount(user) == null) {
            errors.rejectValue("password", "user.password.incorrect");
        }
    }

}