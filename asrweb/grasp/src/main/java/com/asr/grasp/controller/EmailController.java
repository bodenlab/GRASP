package com.asr.grasp.controller;

import com.asr.grasp.objects.EmailObject;
import com.asr.grasp.utils.Defines;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessagePreparator;
import org.springframework.stereotype.Service;

import javax.mail.Message;
import javax.mail.internet.AddressException;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import java.util.Properties;

/**
 * Sends emails for registration and also for when a reconstruction is complete.
 *
 * Created by ariane @ 01/11/2018
 */
@Service
public class EmailController {

    @Value("${spring.mail.host}")
    private String host;

    @Value("${spring.mail.username}")
    private String username;

    @Value("${spring.mail.password}")
    private String password;

    @Value("${spring.mail.port}")
    private int port;

    @Value("${spring.mail.properties.mail.smtp.auth}")
    private String auth;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable}")
    private String enable;

    @Value("${spring.mail.properties.mail.debug}")
    private String debug;

    @Value("${spring.mail.properties.mail.protocol}")
    private String protocol;

    @Value("${project.emailname}")
    private String emailname;

    @Value("${project.bcc}")
    private String bcc;

    @Autowired
    JavaMailSender mailSender;

    /**
     * The sender mail class allows us to inject the passwords and configurations of the
     * web app to create the sending object.
     * <p>
     * Currently this could just be done once - however as we have the saving running on a separate
     * thread it is created each time (adding overhead). ToDo: review this.
     *
     * @return
     */
    @Bean
    public JavaMailSender getMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();

        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setUsername(username);
        mailSender.setPassword(password);

        Properties javaMailProperties = new Properties();
        javaMailProperties.put("mail.smtp.starttls.enable", enable);
        javaMailProperties.put("mail.smtp.auth", auth);
        javaMailProperties.put("mail.transport.protocol", protocol);
        javaMailProperties.put("mail.debug", debug);

        mailSender.setJavaMailProperties(javaMailProperties);
        return mailSender;
    }

    /**
     * Sends the email.
     *
     * @param email
     */
    public void sendEmail(EmailObject email) throws AddressException {

        MimeMessagePreparator preparator = getMessagePreparator(email);
        mailSender = getMailSender();
        try {
            mailSender.send(preparator);
            System.out.println("Message Sent");
        } catch (MailException ex) {
            System.err.println(ex.getMessage());
        }
    }

    /**
     * Prepares the email, we add in the email content and what not here.
     * <p>
     * This takes the email object, if we want to add anything else to the email, this is where
     * it would be done (that isn't simple text). E.g. files.
     *
     * @param email
     * @return
     */
    private MimeMessagePreparator getMessagePreparator(EmailObject email) throws AddressException {

        try {
            // Add in an administrator email address to send a BCC of the email to
            InternetAddress bccAddress = new InternetAddress(bcc);


            MimeMessagePreparator preparator = new MimeMessagePreparator() {

                public void prepare(MimeMessage mimeMessage) throws Exception {
                    mimeMessage.setFrom(emailname);
                    mimeMessage.setRecipient(Message.RecipientType.TO,
                            new InternetAddress(email.getEmail()));

                    mimeMessage.setText(email.getContent());
                    mimeMessage.setSubject(email.getSubject());

//                    // Only send BCC email on certain jobs
//                    if (email.getType() == Defines.RECONSTRUCTION) {
//                        mimeMessage.addRecipient(Message.RecipientType.BCC, bccAddress);
//                    }

                    mimeMessage.addRecipient(Message.RecipientType.BCC, bccAddress);


                }
            };
            return preparator;

        } catch (AddressException ex) {
            throw new AddressException(ex.getMessage());

        }

    }


}