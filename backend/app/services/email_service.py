import smtplib
import os
import random
import calendar
from datetime import date
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from app.config.setting import SMTP_USER, SMTP_PASSWORD, SMTP_SERVER, SMTP_PORT


def send_application_email(candidate_data: dict, job_title: str, ats_score: int = None, ats_summary: str = None):
    """
    Sends a professional HR notification with candidate details, ATS evaluation, and CV attachment.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg['From'] = SMTP_USER
        msg['To'] = SMTP_USER  # Admin/HR Email
        msg['Subject'] = f"[{ats_score}% Match] New Candidate: {candidate_data['full_name']} for {job_title}"

        plain_text = f"""
HR NOTIFICATION: NEW QUALIFIED CANDIDATE
----------------------------------------
Position: {job_title}
Candidate: {candidate_data['full_name']}
ATS Score: {ats_score}%

SUMMARY:
{ats_summary or "No summary available."}

CANDIDATE DETAILS:
- Email: {candidate_data['email']}
- Experience: {candidate_data['experience']}
- Skills: {candidate_data['skills']}

COVER LETTER:
{candidate_data.get('cover_letter', 'No cover letter provided.')}

The candidate's Resume (CV) is attached for your review.
        """

        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;color:#334155;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr style="background:linear-gradient(135deg,#0f172a,#1e293b);">
            <td style="padding:30px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:1.25rem;font-weight:700;">HR Notification</h1>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:0.875rem;">New Qualified Candidate for {job_title}</p>
            </td>
          </tr>

          <!-- ATS Score Row -->
          <tr>
            <td style="padding:30px 40px 0;">
              <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;text-align:center;">
                <p style="margin:0;color:#64748b;font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;font-weight:700;">ATS Match Score</p>
                <h2 style="margin:8px 0 0;color:#2563eb;font-size:2.5rem;font-weight:800;">{ats_score}%</h2>
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px 40px;">
              <h3 style="margin:0 0 16px;color:#0f172a;font-size:1.1rem;font-weight:700;">Candidate Overview</h3>
              <table width="100%" style="font-size:0.95rem;line-height:1.6;">
                <tr>
                  <td width="120" style="color:#64748b;font-weight:600;padding:4px 0;">Name:</td>
                  <td style="color:#0f172a;font-weight:600;padding:4px 0;">{candidate_data['full_name']}</td>
                </tr>
                <tr>
                  <td style="color:#64748b;font-weight:600;padding:4px 0;">Email:</td>
                  <td style="padding:4px 0;"><a href="mailto:{candidate_data['email']}" style="color:#2563eb;text-decoration:none;">{candidate_data['email']}</a></td>
                </tr>
                <tr>
                  <td style="color:#64748b;font-weight:600;padding:4px 0;">Experience:</td>
                  <td style="padding:4px 0;">{candidate_data['experience']}</td>
                </tr>
              </table>

              <div style="margin-top:24px;">
                <h4 style="margin:0 0 8px;color:#0f172a;font-size:0.9rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">ATS Summary</h4>
                <p style="margin:0;color:#475569;font-size:0.95rem;line-height:1.6;background-color:#f8fafc;padding:12px;border-radius:6px;border:1px solid #f1f5f9;">
                  {ats_summary or "No summary provided by AI evaluation."}
                </p>
              </div>

              <div style="margin-top:24px;">
                <h4 style="margin:0 0 8px;color:#0f172a;font-size:0.9rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Skills</h4>
                <p style="margin:0;color:#475569;font-size:0.95rem;">{candidate_data['skills']}</p>
              </div>

              <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e2e8f0;text-align:center;">
                <p style="margin:0;color:#64748b;font-size:0.875rem;">Resume is attached to this email.</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr style="background-color:#f8fafc;border-top:1px solid #e2e8f0;">
            <td style="padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:0.75rem;">Evalyn AI Recruitment System • Internal Notification</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

        msg.attach(MIMEText(plain_text, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))

        cv_path = candidate_data.get('cv_path')
        if cv_path and os.path.exists(cv_path):
            filename = os.path.basename(cv_path)
            with open(cv_path, "rb") as attachment:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f"attachment; filename= {filename}")
            msg.attach(part)

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, SMTP_USER, msg.as_string())
        server.quit()

        print(f"Email sent successfully for application from {candidate_data['full_name']}")
        return True

    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


def pick_interview_slot() -> tuple:
    """
    Picks a random weekday (Mon-Fri) remaining in the current month
    and a random interview time slot.
    Returns (date_obj, formatted_date_str, time_str).
    """
    today = date.today()
    year, month = today.year, today.month
    last_day = calendar.monthrange(year, month)[1]

    # Collect all remaining weekdays this month (excluding today and weekends)
    weekdays = []
    for day in range(today.day + 1, last_day + 1):
        d = date(year, month, day)
        if d.weekday() < 5:  # 0=Mon ... 4=Fri
            weekdays.append(d)

    # If no weekdays left this month, pick from next month
    if not weekdays:
        next_month_year = year if month < 12 else year + 1
        next_month = month + 1 if month < 12 else 1
        last_day_next = calendar.monthrange(next_month_year, next_month)[1]
        for day in range(1, last_day_next + 1):
            d = date(next_month_year, next_month, day)
            if d.weekday() < 5:
                weekdays.append(d)
                if len(weekdays) == 10:
                    break

    chosen_date = random.choice(weekdays)

    time_slots = [
        "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
        "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
        "04:00 PM",
    ]
    chosen_time = random.choice(time_slots)

    day_name = chosen_date.strftime("%A")
    date_str = chosen_date.strftime("%B %d, %Y")

    return chosen_date, f"{day_name}, {date_str}", chosen_time


def send_interview_email(
    candidate_name: str,
    candidate_email: str,
    job_title: str,
    ats_score: int,
    interview_date_str: str = "",
    interview_time: str = ""
):
    """
    Sends a professional HTML interview invitation to the candidate
    when their ATS score is greater than 60.
    Accepts pre-picked date/time strings so the caller can reuse the same
    slot for Google Calendar.
    """
    try:
        if not interview_date_str or not interview_time:
            _, interview_date_str, interview_time = pick_interview_slot()
        interview_date = interview_date_str  # alias for template use

        msg = MIMEMultipart("alternative")
        msg['From'] = SMTP_USER
        msg['To'] = candidate_email
        msg['Subject'] = f"Interview Invitation - {job_title} | Evalyn"

        plain = f"""
Dear {candidate_name},

Congratulations! We are pleased to inform you that after a thorough review of your profile for the {job_title} position at US Tech, you have been shortlisted for an interview.

Our team was impressed with your background, and we would like to invite you for a formal discussion to explore your potential fit within our team.

Your interview is scheduled for {interview_date} at {interview_time}. The meeting will be held at our office located at:
GT road Roshen PLAZA 2nd floar.

Please confirm your availability by replying to this email at your earliest convenience. 

For any concerns or queries, you can contact us directly on WhatsApp at 03351196422. We look forward to meeting you and discussing your future with US Tech.

Best regards,

The US Tech Hiring Team
Evalyn AI Talent Acquisition
        """

        html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:#1e293b;padding:32px 40px;text-align:left;">
              <h1 style="margin:0;font-size:1.5rem;font-weight:700;color:#ffffff;">US Tech</h1>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;">Talent Acquisition</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 20px;color:#0f172a;font-size:1.4rem;font-weight:700;">Interview Invitation</h2>
              
              <p style="margin:0 0 16px;font-size:1rem;line-height:1.6;">Dear {candidate_name},</p>
              
              <p style="margin:0 0 16px;font-size:1rem;line-height:1.6;">
                Congratulations! We are pleased to inform you that after reviewing your application for the 
                <strong style="color:#2563eb;">{job_title}</strong> position, you have been shortlisted for an interview.
              </p>

              <p style="margin:0 0 16px;font-size:1rem;line-height:1.6;">
                We would like to invite you to our office to discuss this opportunity further. Your interview has been scheduled for:
              </p>

              <div style="margin:24px 0;padding:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <p style="margin:0 0 8px;font-size:1rem;font-weight:700;color:#0f172a;">{interview_date}</p>
                <p style="margin:0 0 16px;font-size:1rem;font-weight:700;color:#0f172a;">{interview_time}</p>
                <p style="margin:0;font-size:0.95rem;color:#64748b;">
                  <strong>Location:</strong><br>
                  GT road Roshen PLAZA 2nd floar
                </p>
              </div>

              <p style="margin:0 0 24px;font-size:1rem;line-height:1.6;">
                Please <strong>reply to this email</strong> to confirm your attendance. If you have any questions or concerns prior to the meeting, feel free to reach out to us on WhatsApp at <strong style="color:#25d366;">03351196422</strong>.
              </p>

              <p style="margin:0;font-size:1rem;line-height:1.6;">
                We look forward to meeting you and exploring how your skills can contribute to the success of US Tech.
              </p>

              <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:1rem;font-weight:600;color:#0f172a;">Best regards,</p>
                <p style="margin:4px 0 0;font-size:1rem;color:#475569;">The US Tech Hiring Team</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#f8fafc;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:0.8rem;">Powered by Evalyn AI Recruitment Assistant</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

        msg.attach(MIMEText(plain, "plain"))
        msg.attach(MIMEText(html, "html"))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, candidate_email, msg.as_string())
        server.quit()

        print(f"Interview invitation sent to {candidate_email} (ATS: {ats_score}%) — {interview_date} at {interview_time}")
        return True

    except Exception as e:
        print(f"Failed to send interview email to {candidate_email}: {e}")
        return False
