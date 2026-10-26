"""Sending email over SMTP. Swappable (app.state.mailer) so tests can collect messages instead."""
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr, parseaddr


class SMTPMailer:
    def __init__(self, cfg):
        self.cfg = cfg

    @property
    def enabled(self):
        return self.cfg.email_enabled

    def send(self, to, subject, text):
        cfg = self.cfg
        msg = EmailMessage()
        name, addr = parseaddr(cfg.smtp_from)
        msg["From"] = formataddr((name or "Akada Labs", addr))
        msg["To"] = to
        msg["Subject"] = subject
        msg.set_content(text)
        context = ssl.create_default_context()
        if cfg.smtp_port == 465:
            with smtplib.SMTP_SSL(cfg.smtp_host, cfg.smtp_port, context=context, timeout=20) as s:
                self._login_send(s, msg)
        else:
            with smtplib.SMTP(cfg.smtp_host, cfg.smtp_port, timeout=20) as s:
                s.starttls(context=context)
                self._login_send(s, msg)

    def _login_send(self, s, msg):
        if self.cfg.smtp_user:
            s.login(self.cfg.smtp_user, self.cfg.smtp_password or "")
        s.send_message(msg)


class MemoryMailer:
    """Collects messages instead of sending them (tests and local development)."""
    def __init__(self, enabled=True):
        self.enabled = enabled
        self.sent = []

    def send(self, to, subject, text):
        self.sent.append({"to": to, "subject": subject, "text": text})


def send_many(app, messages, admin_email="system"):
    """Send (to, subject, text) messages one by one; log how it went. Runs as a background task."""
    from .models import AuditLog
    sent = failed = 0
    for to, subject, text in messages:
        try:
            app.state.mailer.send(to, subject, text)
            sent += 1
        except Exception as error:  # one bad address shouldn't stop the rest
            failed += 1
            print(f"Email to {to} failed: {error}")
    with app.state.db.Session() as s:
        s.add(AuditLog(admin_email=admin_email, action="emails sent", detail=f"{sent} sent, {failed} failed"))
        s.commit()


# --------------------------------------------------------------------------- messages

SIGN_OFF = "\n\nAkada Labs\nA free, practical AI course for Nigerians"


def learner_link(cfg, token):
    return f"{cfg.public_url.rstrip('/')}/learn/{token}"


def application_received(name):
    return ("We've received your Akada Labs application",
            f"Hi {name.split()[0]},\n\nThanks for applying to Akada Labs. We review every application by hand, "
            "and we'll email you and message you on WhatsApp with a decision after applications close.\n\n"
            "While you wait, try training your first AI in 10 minutes: it's the same idea as week 1." + SIGN_OFF)


def accepted(cfg, name, token, cohort):
    return (f"You're in: welcome to Akada Labs {cohort}",
            f"Hi {name.split()[0]},\n\nCongratulations! You have a place in Akada Labs {cohort}.\n\n"
            f"This is your private learner dashboard. Bookmark it, and don't share it:\n{learner_link(cfg, token)}\n\n"
            "From there you'll find each week's lab, submit your work and take the week 1 knowledge check. "
            "We'll add you to the cohort WhatsApp group before the first live session." + SIGN_OFF)


def waitlisted(name, cohort):
    return (f"Akada Labs {cohort}: you're on the waitlist",
            f"Hi {name.split()[0]},\n\nThank you for applying. All places in {cohort} are taken for now, but you're on our "
            "waitlist. If a place opens up in the first week, we'll offer it to you by email and WhatsApp." + SIGN_OFF)


def not_accepted(name, cohort):
    return (f"Your Akada Labs {cohort} application",
            f"Hi {name.split()[0]},\n\nThank you for applying to Akada Labs. We had many more applications than places, "
            f"and we weren't able to offer you a place in {cohort}.\n\nPlease apply again for the next cohort: we'll email "
            "you when applications open. In the meantime, keep building!" + SIGN_OFF)


def still_reviewing(name):
    return ("Your Akada Labs application",
            f"Hi {name.split()[0]},\n\nWe've got your application and we're still reviewing it. "
            "We'll email you with a decision after applications close." + SIGN_OFF)


def applications_open(cfg, cohort, close, extra=""):
    when = f" Applications close {close}." if close else ""
    body = (f"Hello,\n\nYou asked us to tell you when Akada Labs opens. Applications for {cohort} are open now.{when}\n\n"
            f"Apply here (it takes about 5 minutes):\n{cfg.public_url.rstrip('/')}/apply\n\n"
            "It's free, it's 12 weeks, and you'll finish with an AI tool of your own on the internet.")
    if extra:
        body += f"\n\n{extra}"
    return (f"Akada Labs {cohort} is open for applications", body + SIGN_OFF)


def announcement(title, body):
    return (f"Akada Labs: {title}", f"{body}" + SIGN_OFF)
