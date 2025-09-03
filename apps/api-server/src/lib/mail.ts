import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(emailId: string, token: string) {
  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: emailId,
    subject: 'Hello World',
    html: `<div>
            <h1>Please click here to login</h1>
            <a target="_blank" href="${process.env.FRONTEND_URL}/api/v1/user/post?token=${token}">Click here</button>
        </div>`
  });

  if (error) {
    return console.error({ error });
  }

  console.log({ data });
  return data;
}