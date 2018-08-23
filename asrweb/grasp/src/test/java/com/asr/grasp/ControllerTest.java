package com.asr.grasp;
import com.asr.grasp.controller.UserController;
import com.asr.grasp.objects.UserObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.instanceOf;
import static org.hamcrest.Matchers.is;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = {GraspConfig.class})
public class ControllerTest {

    //DI
    UserController userController = new UserController();

    @Test
    public void test_ml_always_return_true() {

        //assert correct type/impl
        assertThat(userController, instanceOf(UserController.class));

        UserObject user = new UserObject();
        user.setId(1);
        //assert true
        assertThat(userController.getId(user), is(1));

    }
}
