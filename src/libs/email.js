const nodemailer = require('nodemailer');

const enviarCorreo = async ({ para, asunto, html }) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: 465,
            secure: true,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        const info = await transporter.sendMail({
            from: `"Mi API Portfolio" <${process.env.MAIL_USER}>`,
            to: para,
            subject: asunto,
            html: html
        });

        console.log('📧 Correo enviado: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error enviando correo:', error);
        return false;
    }
};

module.exports = { enviarCorreo };