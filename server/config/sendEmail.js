import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = ({sendTo, subject, html, attachments = []}) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: sendTo,
            subject: subject,
            html: html,
        };
        
        // Add attachments if provided
        if (attachments && attachments.length > 0) {
            mailOptions.attachments = attachments;
        }
        
        transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending email:", error);
        return;
    }
    
    console.log("Email sent successfully");
    return;
};

export default sendEmail;