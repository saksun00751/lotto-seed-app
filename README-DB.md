# 🗄️ Prisma + MariaDB Setup Guide

## 1. Install dependencies

```bash
npm install
# auto-runs: prisma generate (via postinstall)
```

## 2. Create MariaDB database & user

```sql
-- Run as MariaDB root
CREATE DATABASE lotto_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lotto_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON lotto_db.* TO 'lotto_user'@'localhost';
FLUSH PRIVILEGES;
```

## 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="mysql://lotto_user:your_strong_password@127.0.0.1:3306/lotto_db"
SESSION_SECRET=<node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

## 4. Run Prisma migration (creates all tables)

```bash
# First time — creates migration + applies it
npx prisma migrate dev --name init

# Or just push schema without migration history
npx prisma db push
```

## 5. (Optional) Seed demo user

```bash
npm run db:seed
# Creates: phone=0812345678  password=demo1234
```

## 6. Start dev server

```bash
npm run dev   # → http://localhost:3000
```

---

## Useful Prisma Commands

| Command | Description |
|---|---|
| `npm run db:generate` | Regenerate Prisma Client after schema change |
| `npm run db:migrate` | Create + apply new migration |
| `npm run db:push` | Push schema changes directly (no migration file) |
| `npm run db:studio` | Open Prisma Studio (GUI for the database) |
| `npx prisma migrate reset` | Drop DB and re-run all migrations |

---

## Schema Overview

### ระบบผู้ใช้ (Auth)

```
User        — สมาชิก (phone, bcrypt hash, balance, level, referralCode)
OtpCode     — OTP 6 หลัก (TTL 5 นาที, mark used_at เมื่อใช้)
Session     — session token (TTL 7 วัน, HTTP-only cookie)
Referral    — ความสัมพันธ์ผู้แนะนำ-ผู้ถูกแนะนำ
```

---

### ระบบหวย (Lottery)

#### โครงสร้างหมวดหมู่และประเภท

```
LotteryCategory
  │  หมวดหมู่หวย (เช่น หวยไทย, หวยต่างประเทศ, หวยหุ้นไทย)
  │  fields: id, name, emoji, gradient, badge, sortOrder, isActive
  │
  └─► LotteryType
        ประเภทหวยย่อย (เช่น หวยรัฐบาล, ฮานอย 17:00, หุ้นไทย เช้า)
        fields: id, categoryId, name, flag, description, resultTime,
                intervalMinutes (ยี่กี), barClass, sortOrder, isActive
        │
        └─► BetRate
              อัตราจ่ายแยกตาม betType (ปรับได้ต่างกันแต่ละประเภทหวย)
              fields: lotteryTypeId, betType, payRate, minAmount, maxAmount
```

**หมวดหมู่ทั้งหมดในระบบ:**

| id | name | ตัวอย่างประเภทย่อย |
|----|------|-------------------|
| `thai` | หวยไทย | หวยรัฐบาล, หวยออมสิน, หวย ธ.ก.ส. |
| `foreign` | หวยต่างประเทศ | ฮานอย พิเศษ/17:00/VIP/Extra, ลาว, มาเลเซีย |
| `thai_stock` | หวยหุ้นไทย | SET เช้า (11:00), SET บ่าย (14:30), SET ปิด (16:30) |
| `foreign_stock` | หวยหุ้นต่างประเทศ | นิเคอิ, จีน, ฮั่งเส็ง, ดาวโจนส์, สิงคโปร์ |
| `yeekee_speed` | Speed ยี่กี | รอบ 1, 2, 3 (ทุก 5 นาที) |
| `yeekee_super` | Super ยี่กี | VIP (15 นาที), Star |
| `slot` | Slot | สล็อตออนไลน์ |
| `casino` | Casino | บาคาร่า, รูเล็ต |
| `sport` | Sport | แทงบอล, กีฬา |

**ประเภทการแทง (BetType) และอัตราจ่ายเริ่มต้น:**

| BetType | ชื่อ | อัตราจ่าย (x) |
|---------|------|--------------|
| `top3` | 3 ตัวบน | 900 |
| `tod3` | 3 ตัวโต๊ด | 150 |
| `top2` | 2 ตัวบน | 95 |
| `bot2` | 2 ตัวล่าง | 95 |
| `run_top` | วิ่งบน | 3.5 |
| `run_bot` | วิ่งล่าง | 4.5 |

---

#### วงจรงวดหวย (Round Lifecycle)

```
LotteryRound ──────────────────────────────────────────►
  openAt            closeAt          resultAt
    │                  │                │
  [open]  ────────► [closed] ────────► [resulted]
                                            │
                                     LotteryResult
                                       top3, bot2, top2, tod3
```

**RoundStatus:**
- `open` — เปิดรับแทง
- `closed` — ปิดรับแทง รอออกผล
- `resulted` — ออกผลแล้ว ระบบตรวจถูก/ไม่ถูกอัตโนมัติ
- `cancelled` — ยกเลิกงวด (คืนเงินทั้งหมด)

---

#### ใบแทงและรายการแทง

```
BetSlip (ใบแทง)
  │  userId, roundId, slipNo, totalAmount, status
  │
  └─► BetItem[] (รายการเลขในใบแทง)
        number, betType, amount, payRate, payout, isWin, actualPayout
```

**SlipStatus:**

| Status | คำอธิบาย |
|--------|---------|
| `pending` | รอยืนยัน |
| `confirmed` | ยืนยันแล้ว รอผล |
| `won` | ถูกรางวัล |
| `lost` | ไม่ถูก |
| `cancelled` | ยกเลิก |
| `refunded` | คืนเงินแล้ว |

---

#### การเงิน (Financial)

```
Transaction — บันทึกทุกความเคลื่อนไหวทางการเงิน
  type: deposit | withdraw | bet | win | refund | commission | referral_bonus | adjustment
  fields: userId, type, amount, balanceBefore, balanceAfter, referenceId, status

Deposit    — คำขอฝากเงิน พร้อม slipImage (path ไฟล์สลิป)
  status: pending → approved / rejected

Withdrawal — คำขอถอนเงิน
  status: pending → approved → processing → completed / rejected
```

**Flow การแทง:**
```
1. User แทง → หักเงิน balance
              → BetSlip (confirmed) + BetItem[]
              → Transaction(type=bet, amount=-xxx)

2. ออกผล    → ตรวจ BetItem.isWin ทุกรายการ
              → ถูก: เพิ่ม balance + Transaction(type=win, amount=+payout)
              → ไม่ถูก: BetItem.isWin=false (ไม่มี transaction เพิ่มเติม)

3. ยกเลิลงวด → คืนเงินทุก BetSlip
               → Transaction(type=refund) + SlipStatus=refunded
```

---

### ER Diagram (สรุป)

```
User ──┬──► BetSlip ──► BetItem
       ├──► Transaction
       ├──► Deposit
       ├──► Withdrawal
       └──► Referral

LotteryCategory ──► LotteryType ──┬──► BetRate
                                  └──► LotteryRound ──┬──► LotteryResult
                                                      └──► BetSlip
```

## Auth Flows

### Register
1. Validate → `phoneExists()` check → `bcrypt.hash(password, 12)`
2. `prisma.user.create()` → return success

### Login — OTP
1. `findUserByPhone()` → error if not found
2. `createOtp()` → `crypto.randomInt()` → `prisma.otpCode.create()`
3. `sendOtpSms()` → console (dev) / Twilio (prod)
4. User submits → `verifyOtp()` → mark `usedAt`
5. `createSession()` → `prisma.session.create()` → set cookie

### Login — Password
1. `findUserByPhone()` → load hash
2. `bcrypt.compare()` constant-time even if user not found
3. `createSession()` → set cookie

### Logout
1. `destroySession()` → `prisma.session.deleteMany()`
2. `clearSessionCookie()`
3. `redirect("/login")`

## Security
- Passwords: bcrypt cost 12
- Sessions: `crypto.randomBytes(32)` — 64-char hex
- OTPs: `crypto.randomInt()` — cryptographically secure
- Cookie: `HttpOnly`, `Secure` (prod), `SameSite=Lax`
- Timing attack prevention: bcrypt.compare() runs even when user not found
