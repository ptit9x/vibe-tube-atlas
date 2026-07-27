# Supabase Auth Email Templates

Copy these directly into **Supabase Dashboard → Authentication → Email Templates**.

---

## 1. Confirm Sign Up

**Subject:**
```
Welcome to Vibe Tube Atlas! Please confirm your email
```

**Body:**
```html
<h2>Welcome to Vibe Tube Atlas! 👋</h2>
<p>Thanks for signing up. Please confirm your email address to get started:</p>
<p>
  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;background-color:#3B82F6;color:#fff;border-radius:12px;text-decoration:none;font-weight:600;">
    Confirm your email
  </a>
</p>
<p style="color:#9CA3AF;font-size:14px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
```

---

## 2. Invite User

**Subject:**
```
You're invited to join Vibe Tube Atlas 💰
```

**Body:**
```html
<h2>You've been invited to Vibe Tube Atlas!</h2>
<p>Someone has invited you to join Vibe Tube Atlas — your personal finance companion.</p>
<p>Create your account by clicking below:</p>
<p>
  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;background-color:#3B82F6;color:#fff;border-radius:12px;text-decoration:none;font-weight:600;">
    Accept the invitation
  </a>
</p>
<p style="color:#9CA3AF;font-size:14px;">This invitation expires in 7 days.</p>
```

---

## 3. Magic Link

**Subject:**
```
Sign in to Vibe Tube Atlas 🔐
```

**Body:**
```html
<h2>Sign in with one click</h2>
<p>Someone requested a sign-in link for your Vibe Tube Atlas account.</p>
<p>
  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;background-color:#3B82F6;color:#fff;border-radius:12px;text-decoration:none;font-weight:600;">
    Sign in to Vibe Tube Atlas
  </a>
</p>
<p style="color:#9CA3AF;font-size:14px;">This link is one-time use and expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
```

---

## 4. Change Email Address

**Subject:**
```
Confirm your new email address — Vibe Tube Atlas 📧
```

**Body:**
```html
<h2>Verify your new email</h2>
<p>You're updating your Vibe Tube Atlas account email to <strong>{{ .Email }}</strong>.</p>
<p>Please confirm by clicking below:</p>
<p>
  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;background-color:#3B82F6;color:#fff;border-radius:12px;text-decoration:none;font-weight:600;">
    Confirm new email
  </a>
</p>
<p style="color:#9CA3AF;font-size:14px;">This link expires in 24 hours. If you didn't request this change, you can safely ignore this email.</p>
```

---

## 5. Reset Password

**Subject:**
```
Reset your Vibe Tube Atlas password 🔑
```

**Body:**
```html
<h2>Reset your password</h2>
<p>You requested a password reset for your Vibe Tube Atlas account.</p>
<p>Click the button below to create a new password:</p>
<p>
  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;background-color:#3B82F6;color:#fff;border-radius:12px;text-decoration:none;font-weight:600;">
    Reset password
  </a>
</p>
<p style="color:#9CA3AF;font-size:14px;">This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email — your password remains unchanged.</p>
```

---

## 6. Reauthentication

**Subject:**
```
Confirm your identity — Vibe Tube Atlas 🔒
```

**Body:**
```html
<h2>Security confirmation required</h2>
<p>You're performing a sensitive action on your Vibe Tube Atlas account. Please confirm it's you:</p>
<p>
  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;background-color:#3B82F6;color:#fff;border-radius:12px;text-decoration:none;font-weight:600;">
    Confirm it's me
  </a>
</p>
<p style="color:#9CA3AF;font-size:14px;">This link expires in 15 minutes. If you didn't initiate this action, your account is still secure.</p>
```

---

## Notes

- **`{{ .ConfirmationURL }}`** — Supabase auto-generates this for each email
- **`{{ .Email }}`** — Available in Change Email template
- All buttons use **blue-500 (#3B82F6)** to match Vibe Tube Atlas brand
- Redirect URL config: `Supabase Dashboard → Authentication → URL Configuration → Redirect URLs`
  - Add: `https://your-domain.com/reset-password` (for Reset Password)
  - Add: `https://your-domain.com/**` (catch-all for dev)
- Rate limit: Supabase default is **4 emails/hour/user**
