package com.asr.grasp;

import com.asr.grasp.objects.ASRObject;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import java.io.IOException;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.is;

/**
 * Created by gabe on 3/9/18.
 * These tests check that the error messages being thrown by known input errors are being caught and returned to
 * the user correctly.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = {GraspConfig.class})
public class ErrorMessageTest extends BaseTest {

    @Test
    public void testAlnDifferentLength() throws RuntimeException, IOException, InterruptedException {
        setUpEnv();

        ASRObject asr = setAsr("input_test_aln_diff_length_4");

        try {
            asr.runReconstruction();
        } catch (RuntimeException e) {
            // Fail on error
            // assertThat(e, is(equalTo(null)));
        }
    }

    @Test
    public void testAlnDifferentName() throws RuntimeException, IOException, InterruptedException {
        setUpEnv();

        ASRObject asr = setAsr("input_test_diff_names");
        try {
            asr.runReconstruction();
            Assert.fail( "Should have thrown an exception about every sequence not having a match" );
        } catch (RuntimeException e) {
            // Fail on error
            assertThat(e.getMessage().split("\n")[0], is(equalTo("Error: The sequence names in the provided alignment must all have a match in the provided tree." )));
        }
    }
}