package com.asr.grasp.view;

import com.asr.grasp.controller.UserController;
import com.asr.grasp.objects.ShareObject;
import com.asr.grasp.objects.UserObject;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.ModelAndView;

@Component
public class AccountView {

    /**
     * Sets the model and view parameters of the accounts page.
     */
    public ModelAndView get(UserObject loggedInUser, UserController userController) {
        ModelAndView mav = new ModelAndView("account");
        mav.addObject("user", loggedInUser);
        mav.addObject("share", new ShareObject());
        mav.addObject("ownerAccessRecons", userController
                .getOwnerAccessReconIds(loggedInUser));
        mav.addObject("memberAccessRecons", userController
                .getMemberAccessReconIds(loggedInUser));
        mav.addObject("runningRecons", userController
                .getRunningRecons(loggedInUser));
        mav.addObject("username", loggedInUser.getUsername());
        return mav;
    }
}
