use log::{info, error};

/// Email notification service
/// Uses environment variable EMAIL_PROVIDER to determine the provider
/// Supports: sendgrid, mailgun, smtp

#[derive(Clone)]
pub struct EmailService {
    provider: EmailProvider,
    from_email: String,
    from_name: String,
}

#[derive(Clone)]
enum EmailProvider {
    SendGrid { api_key: String },
    Mailgun { api_key: String, domain: String },
    Smtp { host: String, port: u16, username: String, password: String },
    Disabled,
}

impl EmailService {
    pub fn from_env() -> Self {
        let provider = std::env::var("EMAIL_PROVIDER").unwrap_or_else(|_| "disabled".to_string());

        let email_provider = match provider.as_str() {
            "sendgrid" => EmailProvider::SendGrid {
                api_key: std::env::var("SENDGRID_API_KEY").unwrap_or_default(),
            },
            "mailgun" => EmailProvider::Mailgun {
                api_key: std::env::var("MAILGUN_API_KEY").unwrap_or_default(),
                domain: std::env::var("MAILGUN_DOMAIN").unwrap_or_default(),
            },
            "smtp" => EmailProvider::Smtp {
                host: std::env::var("SMTP_HOST").unwrap_or_else(|_| "smtp.gmail.com".to_string()),
                port: std::env::var("SMTP_PORT").unwrap_or_else(|_| "587".to_string()).parse().unwrap_or(587),
                username: std::env::var("SMTP_USERNAME").unwrap_or_default(),
                password: std::env::var("SMTP_PASSWORD").unwrap_or_default(),
            },
            _ => EmailProvider::Disabled,
        };

        Self {
            provider: email_provider,
            from_email: std::env::var("EMAIL_FROM").unwrap_or_else(|_| "noreply@soltip.io".to_string()),
            from_name: std::env::var("EMAIL_FROM_NAME").unwrap_or_else(|_| "SolTip".to_string()),
        }
    }

    pub async fn send_tip_notification(
        &self,
        to_email: &str,
        tipper_name: &str,
        amount_sol: f64,
        message: Option<&str>,
    ) -> Result<(), EmailError> {
        let subject = format!("You received a {:.3} SOL tip!", amount_sol);
        let body = format!(
            r#"
            <h2>You received a tip! 🎉</h2>
            <p><strong>{}</strong> sent you <strong>{:.3} SOL</strong></p>
            {}
            <p>View your dashboard: <a href="https://soltip.io/dashboard">soltip.io/dashboard</a></p>
            <hr>
            <p style="color: #666; font-size: 12px;">You received this email because you have email notifications enabled on SolTip.</p>
            "#,
            tipper_name,
            amount_sol,
            message.map(|m| format!("<p>Message: \"{}\"</p>", m)).unwrap_or_default()
        );

        self.send(to_email, &subject, &body).await
    }

    pub async fn send_goal_reached_notification(
        &self,
        to_email: &str,
        goal_title: &str,
        target_amount: f64,
    ) -> Result<(), EmailError> {
        let subject = format!("Goal \"{}\" has been reached! 🎯", goal_title);
        let body = format!(
            r#"
            <h2>Congratulations! 🎉</h2>
            <p>Your goal "<strong>{}</strong>" has reached its target of <strong>{:.2} SOL</strong>!</p>
            <p>Thank your supporters and withdraw your funds from your dashboard.</p>
            <p><a href="https://soltip.io/dashboard/goals">View Goals</a></p>
            "#,
            goal_title,
            target_amount
        );

        self.send(to_email, &subject, &body).await
    }

    pub async fn send_subscription_renewal_notification(
        &self,
        to_email: &str,
        subscriber_name: &str,
        amount_sol: f64,
    ) -> Result<(), EmailError> {
        let subject = "Subscription renewed".to_string();
        let body = format!(
            r#"
            <h2>Subscription Renewed</h2>
            <p><strong>{}</strong>'s subscription has been renewed for <strong>{:.3} SOL</strong>.</p>
            <p>The funds have been deposited to your vault.</p>
            "#,
            subscriber_name,
            amount_sol
        );

        self.send(to_email, &subject, &body).await
    }

    async fn send(&self, to: &str, subject: &str, html_body: &str) -> Result<(), EmailError> {
        match &self.provider {
            EmailProvider::Disabled => {
                info!("Email disabled, would send to {}: {}", to, subject);
                Ok(())
            }
            EmailProvider::SendGrid { api_key } => {
                self.send_via_sendgrid(api_key, to, subject, html_body).await
            }
            EmailProvider::Mailgun { api_key, domain } => {
                self.send_via_mailgun(api_key, domain, to, subject, html_body).await
            }
            EmailProvider::Smtp { host, port, username, password } => {
                self.send_via_smtp(host, *port, username, password, to, subject, html_body).await
            }
        }
    }

    async fn send_via_sendgrid(
        &self,
        api_key: &str,
        to: &str,
        subject: &str,
        html_body: &str,
    ) -> Result<(), EmailError> {
        let client = reqwest::Client::new();

        let body = serde_json::json!({
            "personalizations": [{
                "to": [{"email": to}]
            }],
            "from": {
                "email": self.from_email,
                "name": self.from_name
            },
            "subject": subject,
            "content": [{
                "type": "text/html",
                "value": html_body
            }]
        });

        let response = client
            .post("https://api.sendgrid.com/v3/mail/send")
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| EmailError::SendFailed(e.to_string()))?;

        if response.status().is_success() {
            info!("Email sent to {} via SendGrid", to);
            Ok(())
        } else {
            let error_text = response.text().await.unwrap_or_default();
            error!("SendGrid error: {}", error_text);
            Err(EmailError::SendFailed(error_text))
        }
    }

    async fn send_via_mailgun(
        &self,
        api_key: &str,
        domain: &str,
        to: &str,
        subject: &str,
        html_body: &str,
    ) -> Result<(), EmailError> {
        let client = reqwest::Client::new();

        let form = [
            ("from", format!("{} <{}>", self.from_name, self.from_email)),
            ("to", to.to_string()),
            ("subject", subject.to_string()),
            ("html", html_body.to_string()),
        ];

        let response = client
            .post(format!("https://api.mailgun.net/v3/{}/messages", domain))
            .basic_auth("api", Some(api_key))
            .form(&form)
            .send()
            .await
            .map_err(|e| EmailError::SendFailed(e.to_string()))?;

        if response.status().is_success() {
            info!("Email sent to {} via Mailgun", to);
            Ok(())
        } else {
            let error_text = response.text().await.unwrap_or_default();
            error!("Mailgun error: {}", error_text);
            Err(EmailError::SendFailed(error_text))
        }
    }

    async fn send_via_smtp(
        &self,
        _host: &str,
        _port: u16,
        _username: &str,
        _password: &str,
        to: &str,
        subject: &str,
        _html_body: &str,
    ) -> Result<(), EmailError> {
        // SMTP implementation would use lettre crate
        // For now, just log
        info!("Would send SMTP email to {}: {}", to, subject);
        Ok(())
    }
}

#[derive(Debug)]
pub enum EmailError {
    SendFailed(String),
    InvalidConfig(String),
}

impl std::fmt::Display for EmailError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EmailError::SendFailed(msg) => write!(f, "Failed to send email: {}", msg),
            EmailError::InvalidConfig(msg) => write!(f, "Invalid email config: {}", msg),
        }
    }
}

impl std::error::Error for EmailError {}
