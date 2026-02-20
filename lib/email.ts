import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
  region: process.env.AWS_SES_REGION || process.env.AWS_REGION || "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL!;

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  await ses.send(
    new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: "Reset your ion7 password" },
        Body: {
          Html: {
            Data: `
<!DOCTYPE html>
<html>
  <body style="font-family:sans-serif;background:#0a0a0a;color:#e5e5e5;padding:40px 20px">
    <div style="max-width:480px;margin:0 auto;background:#111;border:1px solid #222;border-radius:12px;padding:40px">
      <h1 style="font-size:24px;font-weight:700;margin:0 0 8px">ion<span style="color:#6366f1">7</span></h1>
      <h2 style="font-size:18px;font-weight:600;margin:24px 0 8px">Reset your password</h2>
      <p style="color:#a1a1aa;margin:0 0 24px;line-height:1.6">
        We received a request to reset your password. Click the button below to choose a new one.
        This link expires in <strong style="color:#e5e5e5">1 hour</strong>.
      </p>
      <a href="${resetUrl}"
         style="display:inline-block;background:#6366f1;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none">
        Reset Password
      </a>
      <p style="color:#52525b;font-size:12px;margin:24px 0 0;line-height:1.6">
        If you didn't request a password reset, you can safely ignore this email.
        Your password will not be changed.
      </p>
    </div>
  </body>
</html>`,
          },
          Text: {
            Data: `Reset your ion7 password\n\nClick the link below to reset your password. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
          },
        },
      },
    }),
  );
}
