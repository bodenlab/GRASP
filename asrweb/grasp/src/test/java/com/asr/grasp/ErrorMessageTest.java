package com.asr.grasp;

import com.asr.grasp.objects.ASRObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.is;

/**
 * Created by gabe on 3/9/18.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = {GraspConfig.class})
public class ErrorMessageTest extends BaseTest {

    @Test
    public void testAlnDifferentLength() {
        setUpEnv();

        ASRObject asr = new ASRObject();
        asr.setData("input_test_aln_diff_length_4");
//        asr.setData("tawfik");

        asr.setLabel( "-test");
        asr.setWorkingNodeLabel(asr.getNodeLabel());
        asr.setNodeLabel(asr.getNodeLabel());
        asr.runForSession(sessionPath);

        try {
            asr.runReconstruction();
        } catch (Exception e) {
            // Fail on error
            assertThat(e, is(equalTo(null)));
        }
    }
}