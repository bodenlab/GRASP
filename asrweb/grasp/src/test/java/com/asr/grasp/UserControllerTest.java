package com.asr.grasp;
import com.asr.grasp.controller.UserController;
import com.asr.grasp.model.BaseModel;
import com.asr.grasp.model.ReconstructionsModel;
import com.asr.grasp.model.UsersModel;
import com.asr.grasp.objects.UserObject;
import com.asr.grasp.utils.Defines;
import com.fasterxml.jackson.databind.ser.Serializers;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.PropertySource;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.instanceOf;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.equalTo;


@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = {GraspConfig.class})
public class UserControllerTest {

    UserController userController;
    ReconstructionsModel reconModel;
    UsersModel userModel;
    UserObject user;
    String err;

    private UserObject createUser(String username, String password) {
        UserObject user = new UserObject();
        user.setUsername(username);
        user.setPassword(password);
        user.setPasswordMatch(password);
        return user;
    }

    /**
     * Since we are bypassing some of Springs things we need to set up the
     * test environment before we can actually run tests.
     */
    private void setUpEnv() {
        userController = new UserController();
        userModel = new UsersModel();
        userModel.dbPassword = "none";
        userModel.dbUrl = "jdbc:postgresql://localhost:5432/grasp";
        userModel.dbUsername = "web";
        reconModel = new ReconstructionsModel();

        userController.setReconModel(reconModel);
        userController.setUsersModel(userModel);
    }

    /**
     * Helper method for other tests.
     * @param user
     * @return
     */
    private UserObject registerUser(UserObject user) {
        // Register User 1
        err = userController.register(user);

        // check we have no errors
        assertThat(err, is(equalTo(null)));

        // check the ID has been set
        assertThat(user.getId(), not(equalTo(Defines.UNINIT)));

        // Keep track of the userId so we can delete it after
        return user;
    }

    @Test
    public void testRegister() {
        /**
         * Tests that adding a new user via the parameters give us the
         * expected resposes.
         */
        setUpEnv();

        user = createUser("testuser", "testpassword");

        // Register User
        err = userController.register(user);

        // check we have no errors
        assertThat(err, is(equalTo(null)));

        // check the ID has been set
        assertThat(user.getId(), not(equalTo(Defines.UNINIT)));

        // Delete the user to clean up the database
        userModel.deleteUser(userController.getId(user));
    }

    @Test
    public void testRegisterDupName() {
        /**
         * Tests that adding a user with an existing name throws an error.
         */
        setUpEnv();

        user = createUser("testuser", "testpassword");
        user = registerUser(user); // success method tested above

        int userId = user.getId();

        // Re-add that user and check we get the correct error
        user = createUser("testuser", "testpassword");

        // Register User 1
        err = userController.register(user);

        // check we have an error
        assertThat(err, is(equalTo("user.username.duplicate")));

        // check the ID has not been set
        assertThat(user.getId(), is(equalTo(Defines.UNINIT)));

        // Delete the user to clean up the database
        userModel.deleteUser(userId);
    }


}
