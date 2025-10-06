import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
	private transporter;

		constructor() {
			const smtpConfig = {
				host: process.env.SMTP_HOST,
				port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
				secure: process.env.SMTP_SECURE === 'true',
				auth: {
					user: process.env.SMTP_USER,
					pass: process.env.SMTP_PASS,
				},
			};
			console.log('SMTP config:', smtpConfig);
			this.transporter = nodemailer.createTransport(smtpConfig);
		}

		async sendVerificationCode(email: string, code: string) {
			const mailOptions = {
				from: process.env.FROM_EMAIL,
				to: email,
				subject: 'Nawaarni Email verification',
				html: `<p>Your verification code is: <b>${code}</b></p>`,
			};
				try {
					const info = await this.transporter.sendMail(mailOptions);
					console.log('Verification email sent:', info);
				} catch (err) {
					console.error('❌ Failed to send verification email:', err);
					if (err && err.response) {
						console.error('SMTP response:', err.response);
					}
				}
		}

		async sendPasswordResetCode(email: string, code: string) {
			const mailOptions = {
				from: process.env.FROM_EMAIL,
				to: email,
				subject: 'Naawarni Password Reset',
				html: `<p>Voici votre code de réinitialisation de mot de passe : <b>${code}</b></p>`,
			};
			try {
				const info = await this.transporter.sendMail(mailOptions);
				console.log('Password reset email sent:', info);
			} catch (err) {
				console.error('❌ Failed to send password reset email:', err);
				if (err && err.response) {
					console.error('SMTP response:', err.response);
				}
			}
		}
}
