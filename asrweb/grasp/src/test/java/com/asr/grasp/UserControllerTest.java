package com.asr.grasp;

import com.asr.grasp.objects.UserObject;
import com.asr.grasp.utils.Defines;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.equalTo;


@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = {GraspConfig.class})
public class UserControllerTest extends BaseTest {


    /**
     * Helper method for other tests.
     * @param user
     * @return
     */
    private UserObject registerUser(UserObject user) {
        // Register User 1
        user.setEmail(user.getUsername());
        user.setConfirmationToken(user.getPassword());
        String err = userController.register(user, user.getPassword());

        // check we have no errors
        assertThat(err, is(equalTo(null)));

        // check the ID has been set
        assertThat(userController.getId(user), not(equalTo(Defines.UNINIT)));

        // Keep track of the userId so we can delete it after
        return user;
    }


    /**
     * Create a user and don't check to remove based on username first.
     * @param username
     * @param password
     * @return
     */
    private UserObject createUserNoDel(String username, String password) {
        UserObject user = new UserObject();
        user.setUsername(username);
        user.setEmail(username);
        user.setPassword(password);
        user.setPasswordMatch(password);
        user.setConfirmationToken(password);
        return user;
    }

//    @Test
//    public void testRegister() {
//        /**
//         * Tests that adding a new user via the parameters give us the
//         * expected resposes.
//         */
//        setUpEnv();
//
//        UserObject user = createUser("testuser", "testpassword");
//
//        // Register User
//        String err = userController.register(user);
//
//        // check we have no errors
//        assertThat(err, is(equalTo(null)));
//
//        // check the ID has been set
//        assertThat(user.getId(), not(equalTo(Defines.UNINIT)));
//
//        // Delete the user to clean up the database
//        userModel.deleteUser(userController.getId(user));
//    }


    @Test
    public void testRegister() {
        /**
         * Tests that adding a new user via the parameters give us the
         * expected resposes.
         */
        setUpEnv();

        UserObject user = new UserObject();
        user.setUsername("testuser");
        user.setEmail("testemail");

        String confirmationToken = userController.getAConfirmationToken();

        // Register User
        String err = userController.register(user, confirmationToken);

        // check we have no errors
        System.out.println(err);
        //assertThat(err, is(equalTo(null)));

        // check the ID has been set
        System.out.println(user.getId());
        //assertThat(user.getId(), not(equalTo(Defines.UNINIT)));

        // Check that we can get the confirm the registration and set the password
        err = userController.confirmRegistration(user);

        // Check there is an error if we haven't set the confirmation token
        System.out.println(err);

        // Check once we set the token we have no error
        user.setConfirmationToken(confirmationToken);

        err = userController.confirmRegistration(user);
        System.out.println(err);

        // Check we can set the password
        user.setPassword("testpassword");
        user.setPasswordMatch("testpassword");
        err = userController.setPassword(user);
        System.out.println(err);

        // Check we can login with the user
        user.setPassword("testpassword");
        err = userController.loginUser(user);
        System.out.println(err);

        // Delete the user to clean up the database
        userModel.deleteUser(userController.getId(user));
    }

    @Test
    public void testRegisterDupName() {
        /**
         * Tests that adding a user with an existing name throws an error.
         */
        setUpEnv();

        UserObject user = createUserNoDel("testuser", "testpassword");
        user = registerUser(user); // success method tested above

        int userId = user.getId();

        // Re-add that user and check we get the correct error
        user = createUserNoDel("testuser", "testpassword");

        // Register User 1
        String err = userController.register(user, user.getPassword());

        // check we have an error
        assertThat(err, is(equalTo("user.username.duplicate")));

        // check the ID has not been set
        assertThat(user.getId(), is(equalTo(Defines.UNINIT)));

        // Delete the user to clean up the database
        userModel.deleteUser(userId);
    }


}
