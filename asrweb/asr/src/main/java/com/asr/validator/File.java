package com.asr.validator;

import javax.validation.Constraint;
import javax.validation.Payload;
import java.lang.annotation.*;

/**
 * Created by marnie on 19/4/17.
 */
@Documented
@Constraint(validatedBy = FileConstraintValidator.class)
@Target({ElementType.METHOD, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface File {
    String type();
    String message() default "{File}";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}