# 📧 Brevo Email Templates - HTML Code

Copy and paste the HTML code below into each Brevo template.

---

## Template #1: Welcome — roshLingua Cultural Exchange

**Template ID:** 1  
**Subject:** Welcome to roshLingua! 🌍 Start Your Cultural Journey

**HTML Code:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to roshLingua</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
        }
        .message {
            font-size: 14px;
            line-height: 1.8;
            margin-bottom: 30px;
            color: #555;
        }
        .features {
            background-color: #f8f9ff;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 30px 0;
            border-radius: 6px;
        }
        .features h3 {
            margin: 0 0 15px 0;
            color: #667eea;
            font-size: 16px;
        }
        .feature-item {
            font-size: 13px;
            margin: 8px 0;
            color: #555;
            padding-left: 20px;
            position: relative;
        }
        .feature-item:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #667eea;
            font-weight: bold;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 14px 40px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            margin: 30px 0;
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
        }
        .social-links {
            margin: 20px 0;
            text-align: center;
        }
        .social-links a {
            display: inline-block;
            width: 36px;
            height: 36px;
            background-color: #667eea;
            color: white;
            border-radius: 50%;
            line-height: 36px;
            text-decoration: none;
            margin: 0 5px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌍 Welcome to roshLingua</h1>
            <p>Your Gateway to Cultural Exchange</p>
        </div>
        
        <div class="content">
            <div class="greeting">Hi {{name}},</div>
            
            <div class="message">
                Welcome to roshLingua! We're thrilled to have you join our vibrant community of language learners and cultural enthusiasts from around the world.
            </div>
            
            <div class="features">
                <h3>What You Can Do on roshLingua:</h3>
                <div class="feature-item">Connect with language exchange partners</div>
                <div class="feature-item">Share cultural experiences and traditions</div>
                <div class="feature-item">Learn languages through real conversations</div>
                <div class="feature-item">Build meaningful friendships across borders</div>
                <div class="feature-item">Explore diverse cultures and perspectives</div>
            </div>
            
            <div class="message">
                Your journey to cultural exchange starts now. Let's explore the world together!
            </div>
            
            <center>
                <a href="{{appUrl}}/explore" class="cta-button">Start Exploring</a>
            </center>
            
            <div class="message" style="font-size: 12px; color: #999; margin-top: 40px;">
                If you have any questions, feel free to reach out to our support team. We're here to help!
            </div>
        </div>
        
        <div class="footer">
            <p>© 2025 roshLingua. All rights reserved.</p>
            <p>Made with ❤️ for global cultural exchange</p>
        </div>
    </div>
</body>
</html>
```

---

## Template #2: Forgot Password — roshLingua

**Template ID:** 2  
**Subject:** Reset Your roshLingua Password

**HTML Code:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
        }
        .message {
            font-size: 14px;
            line-height: 1.8;
            margin-bottom: 20px;
            color: #555;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 6px;
            font-size: 13px;
            color: #856404;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 14px 40px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            margin: 30px 0;
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .link-box {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            word-break: break-all;
        }
        .link-box p {
            margin: 0 0 10px 0;
            font-size: 12px;
            color: #999;
        }
        .link-box a {
            color: #f5576c;
            text-decoration: none;
            font-weight: 600;
            font-size: 13px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Reset Your Password</h1>
        </div>
        
        <div class="content">
            <div class="greeting">Hi {{name}},</div>
            
            <div class="message">
                We received a request to reset your roshLingua password. Click the button below to create a new password.
            </div>
            
            <center>
                <a href="{{resetLink}}" class="cta-button">Reset Password</a>
            </center>
            
            <div class="warning">
                <strong>⏰ Important:</strong> This link expires in {{expiryTime}}. If you didn't request a password reset, you can safely ignore this email.
            </div>
            
            <div class="message">
                If the button doesn't work, you can also copy and paste this link in your browser:
            </div>
            
            <div class="link-box">
                <p>Reset Link:</p>
                <a href="{{resetLink}}">{{resetLink}}</a>
            </div>
            
            <div class="message" style="font-size: 12px; color: #999;">
                For security reasons, never share this link with anyone. roshLingua support will never ask for your password.
            </div>
        </div>
        
        <div class="footer">
            <p>© 2025 roshLingua. All rights reserved.</p>
            <p>Questions? Contact our support team</p>
        </div>
    </div>
</body>
</html>
```

---

## Template #3: Verify Your roshLingua Account

**Template ID:** 3  
**Subject:** Verify Your Email Address

**HTML Code:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
        }
        .message {
            font-size: 14px;
            line-height: 1.8;
            margin-bottom: 20px;
            color: #555;
        }
        .verification-code {
            background-color: #f0f7ff;
            border: 2px dashed #4facfe;
            padding: 20px;
            text-align: center;
            border-radius: 6px;
            margin: 30px 0;
            font-size: 24px;
            font-weight: 700;
            color: #4facfe;
            letter-spacing: 2px;
            font-family: 'Courier New', monospace;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 14px 40px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            margin: 30px 0;
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #4facfe;
            padding: 15px;
            margin: 20px 0;
            border-radius: 6px;
            font-size: 13px;
            color: #555;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Verify Your Email</h1>
        </div>
        
        <div class="content">
            <div class="greeting">Hi {{name}},</div>
            
            <div class="message">
                Thank you for signing up for roshLingua! To complete your registration and start your cultural exchange journey, please verify your email address.
            </div>
            
            <center>
                <a href="{{verifyLink}}" class="cta-button">Verify Email</a>
            </center>
            
            <div class="info-box">
                <strong>⏰ Note:</strong> This verification link expires in {{expiryTime}}. Make sure to verify your email before it expires.
            </div>
            
            <div class="message">
                If the button doesn't work, copy and paste this link in your browser:
            </div>
            
            <div style="background-color: #f0f7ff; padding: 15px; border-radius: 6px; word-break: break-all; font-size: 12px;">
                <a href="{{verifyLink}}" style="color: #4facfe; text-decoration: none;">{{verifyLink}}</a>
            </div>
            
            <div class="message" style="font-size: 12px; color: #999; margin-top: 30px;">
                If you didn't create this account, please ignore this email.
            </div>
        </div>
        
        <div class="footer">
            <p>© 2025 roshLingua. All rights reserved.</p>
            <p>Welcome to our global community! 🌍</p>
        </div>
    </div>
</body>
</html>
```

---

## Template #4: New Message Notification — roshLingua

**Template ID:** 4  
**Subject:** New Message from {{senderName}} 💬

**HTML Code:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Message</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
        }
        .message-box {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-left: 4px solid #667eea;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .sender-name {
            font-size: 14px;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 10px;
        }
        .message-preview {
            font-size: 14px;
            color: #333;
            line-height: 1.6;
            font-style: italic;
            margin: 10px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 14px 40px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            margin: 30px 0;
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .info-text {
            font-size: 13px;
            color: #666;
            line-height: 1.6;
            margin: 20px 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💬 New Message</h1>
        </div>
        
        <div class="content">
            <div class="greeting">Hi {{recipientName}},</div>
            
            <div class="info-text">
                You have a new message from <strong>{{senderName}}</strong> on roshLingua!
            </div>
            
            <div class="message-box">
                <div class="sender-name">📨 {{senderName}} wrote:</div>
                <div class="message-preview">
                    "{{messagePreview}}"
                </div>
            </div>
            
            <div class="info-text">
                Don't miss out on this conversation! Click the button below to reply and continue your cultural exchange.
            </div>
            
            <center>
                <a href="{{chatLink}}" class="cta-button">View Message</a>
            </center>
            
            <div class="info-text" style="font-size: 12px; color: #999;">
                You're receiving this email because you have message notifications enabled. You can change your notification preferences in your account settings.
            </div>
        </div>
        
        <div class="footer">
            <p>© 2025 roshLingua. All rights reserved.</p>
            <p>Keep the conversation going! 🌍</p>
        </div>
    </div>
</body>
</html>
```

---

## ✅ Summary

| Template # | Name | Variables | Subject |
|-----------|------|-----------|---------|
| 1 | Welcome | `{{name}}`, `{{appUrl}}` | Welcome to roshLingua! 🌍 Start Your Cultural Journey |
| 2 | Password Reset | `{{name}}`, `{{resetLink}}`, `{{expiryTime}}` | Reset Your roshLingua Password |
| 3 | Email Verification | `{{name}}`, `{{verifyLink}}`, `{{expiryTime}}` | Verify Your Email Address |
| 4 | New Message | `{{recipientName}}`, `{{senderName}}`, `{{messagePreview}}`, `{{chatLink}}` | New Message from {{senderName}} 💬 |

---

## 📝 How to Add to Brevo

1. Go to https://app.brevo.com → Templates → Create Template
2. Copy the HTML code above
3. Paste into the template editor
4. Set the subject line
5. Make sure template ID matches (1, 2, 3, or 4)
6. Save and activate

All templates are mobile-responsive and follow roshLingua branding! 🎨
