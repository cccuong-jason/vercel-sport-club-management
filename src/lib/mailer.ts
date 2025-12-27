import nodemailer from 'nodemailer'

export function getTransport() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) throw new Error('SMTP env not configured')
  return nodemailer.createTransport({ host, port, auth: { user, pass } })
}

function getEmailTemplate(title: string, content: string, actionUrl?: string, actionText?: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 32px; color: #374151; line-height: 1.6; }
        .content h2 { color: #1f2937; margin-top: 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 16px 0; }
        .button:hover { background: #2563eb; }
        .footer { background: #f1f5f9; padding: 24px; text-align: center; color: #64748b; font-size: 14px; }
        .details { background: #f8fafc; padding: 16px; border-radius: 6px; margin: 16px 0; }
        .details strong { color: #1f2937; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚽ Football Club Management</h1>
        </div>
        <div class="content">
          ${content}
          ${actionUrl ? `<a href="${actionUrl}" class="button">${actionText}</a>` : ''}
        </div>
        <div class="footer">
          <p>This is an automated message from your football club management system.</p>
          <p>© 2024 Football Club Management System</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendEventNotification(to: string, subject: string, html: string) {
  const transporter = getTransport()
  await transporter.sendMail({ from: process.env.SMTP_USER, to, subject, html })
}

export async function sendEventInvitation(to: string, eventName: string, eventDate: string, eventLocation: string, eventId: string) {
  const content = `
    <h2>You're Invited! 🎉</h2>
    <p>You're invited to join our upcoming football event:</p>
    <div class="details">
      <p><strong>Event:</strong> ${eventName}</p>
      <p><strong>Date:</strong> ${new Date(eventDate).toLocaleString()}</p>
      <p><strong>Location:</strong> ${eventLocation}</p>
    </div>
    <p>We'd love to see you there! Please RSVP to let us know if you can make it.</p>
  `
  
  const html = getEmailTemplate('Event Invitation', content, `${process.env.NEXTAUTH_URL}/events/${eventId}`, 'View Event & RSVP')
  await sendEventNotification(to, `You're invited: ${eventName}`, html)
}

export async function sendEventReminder(to: string, eventName: string, eventDate: string, eventLocation: string, eventId: string) {
  const content = `
    <h2>Event Reminder ⏰</h2>
    <p>This is a friendly reminder about our upcoming football event:</p>
    <div class="details">
      <p><strong>Event:</strong> ${eventName}</p>
      <p><strong>Date:</strong> ${new Date(eventDate).toLocaleString()}</p>
      <p><strong>Location:</strong> ${eventLocation}</p>
    </div>
    <p>Don't forget to bring your gear and arrive 15 minutes early for warm-up!</p>
  `
  
  const html = getEmailTemplate('Event Reminder', content, `${process.env.NEXTAUTH_URL}/events/${eventId}`, 'View Event Details')
  await sendEventNotification(to, `Reminder: ${eventName} is coming up!`, html)
}

export async function sendPaymentConfirmation(to: string, matchTitle: string, amount: number, paymentStatus: string, matchId: string) {
  const content = `
    <h2>Payment Confirmation 💳</h2>
    <p>Your match payment has been processed:</p>
    <div class="details">
      <p><strong>Match:</strong> ${matchTitle}</p>
      <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
      <p><strong>Status:</strong> ${paymentStatus === 'paid' ? '✅ Confirmed' : '⏳ Pending'}</p>
    </div>
    <p>Thank you for your payment! ${paymentStatus === 'paid' ? 'Your spot is confirmed.' : 'Your payment is being reviewed and will be confirmed soon.'}</p>
  `
  
  const html = getEmailTemplate('Payment Confirmation', content, `${process.env.NEXTAUTH_URL}/match-payments/${matchId}`, 'View Match Details')
  await sendEventNotification(to, `Payment ${paymentStatus}: ${matchTitle}`, html)
}

export async function sendMVPResults(to: string, matchTitle: string, mvpName: string, votes: number, matchId: string) {
  const content = `
    <h2>MVP Results 🏆</h2>
    <p>The votes are in! Here are the MVP results for the recent match:</p>
    <div class="details">
      <p><strong>Match:</strong> ${matchTitle}</p>
      <p><strong>MVP:</strong> ${mvpName}</p>
      <p><strong>Votes Received:</strong> ${votes}</p>
    </div>
    <p>Congratulations to the MVP! Check out the full results and statistics.</p>
  `
  
  const html = getEmailTemplate('MVP Results', content, `${process.env.NEXTAUTH_URL}/matches/${matchId}`, 'View Full Results')
  await sendEventNotification(to, `MVP Results: ${matchTitle}`, html)
}

export async function sendFundUpdate(to: string, updateType: 'contribution' | 'expense', amount: number, reason: string, currentBalance: number) {
  const content = `
    <h2>Fund Update 💰</h2>
    <p>There has been a ${updateType === 'contribution' ? 'contribution' : 'expense'} to the club funds:</p>
    <div class="details">
      <p><strong>Type:</strong> ${updateType === 'contribution' ? '💰 Contribution' : '💸 Expense'}</p>
      <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p><strong>Current Balance:</strong> $${currentBalance.toFixed(2)}</p>
    </div>
    <p>Thank you for keeping our club financially healthy!</p>
  `
  
  const html = getEmailTemplate('Fund Update', content, `${process.env.NEXTAUTH_URL}/funds`, 'View Fund Details')
  await sendEventNotification(to, `Fund ${updateType}: $${amount.toFixed(2)}`, html)
}

export async function sendTeamAnnouncement(to: string, announcement: string, teamName: string, teamId: string) {
  const content = `
    <h2>Team Announcement 📢</h2>
    <p>Important announcement from ${teamName}:</p>
    <div class="details">
      <p><strong>Message:</strong></p>
      <p>${announcement}</p>
    </div>
    <p>Please check the team page for more details and updates.</p>
  `
  
  const html = getEmailTemplate('Team Announcement', content, `${process.env.NEXTAUTH_URL}/teams/${teamId}`, 'View Team Page')
  await sendEventNotification(to, `Team Announcement: ${teamName}`, html)
}

export async function sendWelcomeEmail(to: string, userName: string) {
  const content = `
    <h2>Welcome to the Club! ⚽</h2>
    <p>Hi ${userName},</p>
    <p>Welcome to our football club management system! We're excited to have you as part of our community.</p>
    <div class="details">
      <p><strong>Getting Started:</strong></p>
      <ul>
        <li>Check out upcoming events and RSVP</li>
        <li>Join a team or create your own</li>
        <li>Track your match payments and attendance</li>
        <li>Vote for MVPs and participate in club activities</li>
      </ul>
    </div>
    <p>If you have any questions, feel free to reach out to our admin team.</p>
  `
  
  const html = getEmailTemplate('Welcome', content, `${process.env.NEXTAUTH_URL}/events`, 'Explore Events')
  await sendEventNotification(to, 'Welcome to our Football Club!', html)
}

