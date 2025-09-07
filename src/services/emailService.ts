import nodemailer from "nodemailer";
console.log(
  "Iniciando servicio de email...",
  process.env.SMTP_HOST,
  process.env.SMTP_PORT,
  process.env.EMAIL_USER
);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailParams) {
  try {
    const info = await transporter.sendMail({
      from: `"Sistema de Cobranzas" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error enviando email:", error);
    return { success: false, error };
  }
}
