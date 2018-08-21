package com.asr.grasp.controller;

import org.springframework.mail.SimpleMailMessage;


public interface IEmailService {

    void sendEmail(SimpleMailMessage email);

}
