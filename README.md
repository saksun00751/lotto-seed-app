# Lotto Login — Next.js 14 App Router

## 🚀 เริ่มใช้งาน

```bash
npm install
npm run dev
# → http://localhost:3000/login
```

## 📁 โครงสร้างไฟล์

```
app/
  layout.tsx              root layout (Noto Sans Thai)
  page.tsx                redirect → /login
  globals.css             Tailwind styles
  login/
    page.tsx              หน้า Login (Server Component)

components/
  auth/
    LoginForm.tsx         Client Component หลัก (3 states)
  ui/
    Input.tsx             Reusable input + validation
    Button.tsx            Reusable button + loading state

lib/
  actions.ts              Server Actions

types/
  auth.ts                 TypeScript types
```

## ✅ Features

| Feature | รายละเอียด |
|---------|-----------|
| 📱 เบอร์โทรศัพท์ | auto-format `0XX-XXX-XXXX`, validate 10 หลัก |
| 🌐 Social Login | Google, Facebook, LINE |
| 👁️ Show/Hide password | password field (optional) |
| ☑️ Remember me | animated checkbox |
| ❓ Forgot password | link |
| ✨ Animations | fade-up, shake on error, pop-in checkmark |
| 🎯 Server Actions | ไม่ต้องสร้าง API route แยก |

## 🔗 ต่อยอด Auth จริง

### NextAuth + Credentials
```bash
npm install next-auth
```

## 🎨 Design Tokens (tailwind.config.ts)

```
ap-bg       #f5f5f7    พื้นหลัง
ap-card     #ffffff    card
ap-blue     #0071e3    primary action (Apple blue)
ap-primary  #1d1d1f    text หลัก
ap-secondary #6e6e73   text รอง
ap-tertiary #aeaeb2    placeholder / hint
ap-red      #ff3b30    error
ap-green    #34c759    success
```

