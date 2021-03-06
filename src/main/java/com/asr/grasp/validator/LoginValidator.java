package com.asr.grasp.validator;

import com.asr.grasp.objects.UserObject;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.ValidationUtils;
import org.springframework.validation.Validator;

@Component
public class LoginValidator implements Validator {

    UserObject user;

    @Override
    public boolean supports(Class<?> aClass) {
        return UserObject.class.equals(aClass);
    }

    @Override
    public void validate(Object o, Errors errors) {
        ValidationUtils.rejectIfEmptyOrWhitespace(errors, "username", "user.username.empty");
        ValidationUtils.rejectIfEmptyOrWhitespace(errors, "password", "user.password.empty");

        user = (UserObject) o;

        /**
         * We'll only use this if we add an email in. For now it does nothing.
         */
    }

}