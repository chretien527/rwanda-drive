# 📧 Email Configuration for Rwanda Drive

## ✅ What I've Implemented

### 1. **Email Service Created**
- Created `backend/internal/auth/email_service.go`
- Supports Gmail SMTP for sending emails
- HTML email templates for verification and password reset
- Automatic fallback when email is not configured (shows tokens in logs)

### 2. **Email Integration**
- Updated auth service to use email service
- Email verification tokens are now sent to user's Gmail
- Password reset tokens are emailed
- Beautiful HTML email templates with clickable links

### 3. **Environment Variables Added**
Updated `backend/.env` with email configuration:

```env
# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-gmail@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@rwandadrive.com
SMTP_FROM_NAME=Rwanda Drive
FRONTEND_URL=http://localhost:3000
```

## 🔧 How to Configure Gmail Sending

### Step 1: Get Gmail App Password

1. **Go to your Google Account**: https://myaccount.google.com
2. **Security** → **2-Step Verification** (enable if not already)
3. **Security** → **App passwords**
4. **Generate app password** for "Mail"
5. **Copy the 16-character password** (like `abcd efgh ijkl mnop`)

### Step 2: Update .env File

Replace these values in `backend/.env`:

```env
SMTP_USERNAME=youremail@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
SMTP_FROM_EMAIL=youremail@gmail.com
SMTP_FROM_NAME=Rwanda Drive
```

### Step 3: Restart Backend

```powershell
# Backend will automatically detect email config on startup
```

## 📧 Email Templates

### Email Verification
```
Subject: Verify Your Email - Rwanda Drive

Beautiful HTML email with:
✅ Welcome message
✅ Clickable "Verify Email Address" button  
✅ Backup verification link
✅ Token for manual entry
✅ 24-hour expiration notice
```

### Password Reset
```
Subject: Password Reset Request - Rwanda Drive

HTML email with:
🔒 Password reset explanation
🔒 Clickable "Reset Password" button
🔒 Backup reset link  
🔒 Token for manual entry
🔒 1-hour expiration notice
```

## 🔄 How It Works

### Registration Flow:
1. User registers → `POST /api/v1/auth/register`
2. Backend creates user account
3. **Generates verification token**
4. **📧 Sends email to user's Gmail**
5. User clicks link or enters token → `POST /api/v1/auth/verify-email`
6. Account activated

### Password Reset Flow:
1. User forgot password → `POST /api/v1/auth/password/forgot`
2. Backend generates reset token
3. **📧 Sends email to user's Gmail**
4. User clicks link or enters token → `POST /api/v1/auth/password/reset`
5. Password updated

## ⚙️ Email Service Features

### Smart Configuration Detection
```go
if !emailService.IsConfigured() {
    // Falls back to console logging
    logger.Info("Verification token: ABC123...")
}
```

### Gmail SMTP Settings
```go
Host: smtp.gmail.com
Port: 587 (TLS)
Authentication: Plain Auth
```

### HTML Email Templates
- **Responsive design** (works on mobile)
- **Professional branding** (Rwanda Drive colors)
- **Clickable buttons** for easy verification
- **Fallback text** for accessibility
- **Token display** for manual entry if needed

## 🧪 Testing Email

### Option 1: Configure Real Gmail
Update `.env` with real Gmail credentials and test registration.

### Option 2: Development Mode (Default)
Without email config, tokens appear in backend logs:
```
INFO: Verification token for user@example.com: abc123def456...
```

### Option 3: Test with curl
```powershell
# Register new user
curl -X POST http://localhost:8080/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"password123","role":"DRIVER"}'

# Check backend logs for token or check email
```

## 🔒 Security Features

### Production Safety
- **Environment detection**: Different behavior in dev vs prod
- **App passwords**: More secure than regular passwords
- **Token expiration**: Verification (24h), Reset (1h)
- **Token hashing**: Tokens are hashed in database
- **Rate limiting**: Max 3 verification attempts per hour

### Error Handling
- **Email failures don't break registration**
- **Graceful fallback to console logging**
- **User-friendly error messages**
- **Detailed logging for debugging**

## 📋 Email Configuration Status

| Component | Status | Description |
|-----------|--------|-------------|
| **Email Service** | ✅ **Created** | SMTP service with Gmail support |
| **Verification Emails** | ✅ **Integrated** | Sent on registration |
| **Password Reset Emails** | ✅ **Integrated** | Sent on forgot password |
| **HTML Templates** | ✅ **Beautiful** | Professional email design |
| **Environment Config** | ✅ **Ready** | Just add Gmail credentials |
| **Fallback Mode** | ✅ **Working** | Logs tokens when email disabled |

## 🚀 Next Steps

1. **Add your Gmail credentials** to `backend/.env`
2. **Restart the backend** to load email config
3. **Test registration** at http://localhost:3000
4. **Check your Gmail inbox** for verification emails!

## ⚠️ Important Notes

- **Use App Password**, not your regular Gmail password
- **Enable 2FA** on your Google account first
- **Tokens work even if email fails** (check backend logs)
- **Email config is optional** for development
- **Frontend needs to handle verification flow** (click links, enter tokens)

---

**Your Rwanda Drive app can now send verification tokens to Gmail! 📧✨**