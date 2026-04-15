# DingDongSpeak — CLAUDE.md

## Tổng quan dự án

**DingDongSpeak** là nền tảng luyện nói tiếng Anh và luyện Speaking IELTS bằng AI, nhắm đến người dùng Việt Nam.
- **Stack**: Next.js 14 (App Router) + TypeScript, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes + Prisma ORM
- **Database & Hosting**: Railway (PostgreSQL)
- **AI/Speech APIs**: Google Gemini (chấm điểm, tạo câu hỏi), Groq (LLM dự phòng/nhanh), Deepgram (TTS đọc câu hỏi & STT ghi âm)
- **Auth**: NextAuth.js (email/password + Google OAuth)
- **Payment**: Stripe hoặc cổng thanh toán nội địa (MoMo/VNPay)
- **PDF Export**: react-pdf hoặc @react-pdf/renderer

---

## Design System

### Màu sắc & Theme
- **Homepage**: Dark navy blue (`#0A0F1E`), lưới grid (CSS grid background), accent xanh điện (`#00D4FF`), gradient tím-xanh
- **App pages**: Hỗ trợ Light / Dark mode (toggle), dùng CSS variables + `next-themes`
- **Primary accent**: `#00D4FF` (cyan/electric blue)
- **Secondary accent**: `#7C3AED` (violet)
- **Success**: `#10B981` | **Warning**: `#F59E0B` | **Error**: `#EF4444`

### Typography
- Font chính: **Inter** (UI) + **Space Grotesk** (headings)
- Heading scale: 4xl → 6xl trên desktop, 2xl → 4xl trên mobile

### Animations & Transitions
- Dùng **Framer Motion** cho tất cả page transitions (slide + fade)
- Micro-interactions trên buttons, cards (hover scale, glow effects)
- Loading skeletons thay cho spinners
- Smooth scroll behavior

### Responsive & Mobile
- Mobile-first approach
- **Hamburger menu** (3 sọc → X animation) trên viewport < 768px
- Bottom navigation bar trên mobile app pages
- Breakpoints: `sm:640` `md:768` `lg:1024` `xl:1280`

---

## Cấu trúc thư mục

```
dingdongspeak/
├── app/
│   ├── (marketing)/          # Trang landing, pricing, about
│   │   ├── page.tsx          # Homepage (dark navy + grid)
│   │   ├── pricing/
│   │   └── about/
│   ├── (auth)/               # Auth pages
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (app)/                # App pages (yêu cầu đăng nhập)
│   │   ├── dashboard/        # Dashboard + heatmap + leaderboard
│   │   ├── learn/            # Phần 1: Beginner path
│   │   │   ├── path/         # Bản đồ chặng đường
│   │   │   ├── lesson/[id]/  # Bài học vocabulary/grammar
│   │   │   └── speak/[id]/   # Luyện nói theo chủ đề
│   │   ├── practice/         # Phần 2: IELTS Speaking Practice
│   │   │   ├── page.tsx      # Chọn topic, part, số câu
│   │   │   └── session/[id]/ # Phiên luyện tập
│   │   ├── mock-test/        # Phần 3: Full IELTS Mock Test
│   │   │   ├── page.tsx
│   │   │   └── session/[id]/
│   │   ├── review/           # Ôn tập: vocab, idioms đã lưu
│   │   ├── profile/          # Hồ sơ người dùng
│   │   └── premium/          # Trang nạp premium
│   ├── api/
│   │   ├── auth/             # NextAuth endpoints
│   │   ├── ai/
│   │   │   ├── score/        # Gemini chấm điểm
│   │   │   ├── question/     # Tạo câu hỏi IELTS
│   │   │   └── sample/       # Câu trả lời mẫu
│   │   ├── speech/
│   │   │   ├── tts/          # Deepgram TTS (đọc câu hỏi)
│   │   │   └── stt/          # Deepgram STT (nhận dạng giọng)
│   │   ├── payment/          # Thanh toán webhook
│   │   ├── share/            # Hệ thống referral
│   │   └── export/pdf/       # Export PDF
│   └── layout.tsx
├── components/
│   ├── ui/                   # Base components (Button, Card, Modal...)
│   ├── layout/               # Navbar, Sidebar, Footer, MobileMenu
│   ├── learn/                # Components phần 1 (GamePath, LivesBar...)
│   ├── practice/             # Components phần 2 (Recorder, ScoreCard...)
│   ├── dashboard/            # Heatmap, Leaderboard, StatsCard
│   └── shared/               # ThemeToggle, LanguageSelect, ShareButton
├── lib/
│   ├── gemini.ts             # Gemini API client + prompts
│   ├── groq.ts               # Groq API client
│   ├── deepgram.ts           # Deepgram TTS + STT client
│   ├── prisma.ts             # Prisma client singleton
│   ├── auth.ts               # NextAuth config
│   └── tokens.ts             # Token/lives logic
├── prisma/
│   └── schema.prisma
├── hooks/
│   ├── useRecorder.ts        # Web Audio API recording hook
│   ├── useToken.ts           # Token balance & deduction
│   └── useLives.ts           # Lives system (Part 1)
└── types/
    └── index.ts
```

---

## Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  avatar        String?
  passwordHash  String?
  googleId      String?   @unique
  isPremium     Boolean   @default(false)
  premiumUntil  DateTime?
  tokens        Int       @default(30)      // free tokens
  lives         Int       @default(5)       // Part 1 lives
  livesLastRegen DateTime @default(now())
  referralCode  String    @unique           // mã giới thiệu
  referredBy    String?                     // user đã giới thiệu
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      PracticeSession[]
  savedItems    SavedItem[]
  lessonProgress LessonProgress[]
  referrals     Referral[]
  streaks       Streak[]
}

model PracticeSession {
  id            String    @id @default(cuid())
  userId        String
  type          SessionType  // BEGINNER | PRACTICE | MOCK_TEST
  topic         String
  part          IELTSPart?   // PART1 | PART2 | PART3 | FULL
  questions     Json         // array of Q&A
  scores        Json         // overall, fluency, grammar, vocab, pronunciation
  duration      Int          // giây
  createdAt     DateTime  @default(now())
  user          User      @relation(fields: [userId], references: [id])
}

model SavedItem {
  id        String    @id @default(cuid())
  userId    String
  type      SavedType // VOCABULARY | IDIOM | SAMPLE_ANSWER
  content   String
  context   String?   // câu hỏi liên quan
  topic     String?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id])
}

model LessonProgress {
  id         String   @id @default(cuid())
  userId     String
  lessonId   String
  completed  Boolean  @default(false)
  score      Int?
  completedAt DateTime?
  user       User     @relation(fields: [userId], references: [id])
}

model Referral {
  id            String   @id @default(cuid())
  referrerId    String   // người chia sẻ
  refereeId     String   // người được giới thiệu
  hasUsedApp    Boolean  @default(false)  // đã dùng lần đầu chưa
  rewardGiven   Boolean  @default(false)
  createdAt     DateTime @default(now())
  referrer      User     @relation(fields: [referrerId], references: [id])
}

model Streak {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime @db.Date
  practiced Boolean  @default(true)
  user      User     @relation(fields: [userId], references: [id])

  @@unique([userId, date])
}
```

---

## Environment Variables

```env
# Database (Railway PostgreSQL)
DATABASE_URL=

# NextAuth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI APIs
GEMINI_API_KEY=
GROQ_API_KEY=
DEEPGRAM_API_KEY=

# Payment
PAYMENT_WEBHOOK_SECRET=
MOMO_PARTNER_CODE=
MOMO_ACCESS_KEY=
MOMO_SECRET_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Tính năng chi tiết

### Phần 1 — Beginner Path (Duolingo-style)

**Giao diện bản đồ chặng đường:**
- Hiển thị dạng path/road với các node bài học
- Mỗi chặng gồm: Vocabulary → Grammar → Speaking Topic
- Node đã hoàn thành: filled + gold star, đang học: pulsing, chưa mở: locked

**Lives System:**
- Bắt đầu với 5 mạng (tim đỏ)
- Mất 1 mạng khi trả lời sai hoặc phát âm dưới ngưỡng
- Hồi 1 mạng mỗi 30 phút (hiện countdown timer)
- Premium: unlimited lives
- Tích lũy streak dài → bonus lives

**Game mechanics:**
- Flashcard vocabulary với spaced repetition
- Fill-in-blank grammar exercises
- Speaking: user ghi âm → Deepgram STT → Gemini chấm → hiện score + feedback
- Score rubric cho Part 1: Accuracy (40%) + Pronunciation (30%) + Fluency (30%)

**Export PDF:**
- Nút "Export bài học hôm nay" trên mỗi lesson
- PDF đẹp gồm: vocabulary list, grammar notes, bài tập đã làm, điểm số

---

### Phần 2 — IELTS Speaking Practice

**Flow:**
1. Chọn topic (từ danh sách ~50 chủ đề thông dụng IELTS)
2. Chọn Part (1 / 2 / 3 / Kết hợp)
3. Chọn số câu hỏi (3 / 5 / 10)
4. Deepgram TTS đọc câu hỏi với giọng examiner chuyên nghiệp
5. User nhấn Record → ghi âm → nhấn Stop
6. Deepgram STT → transcript → Gemini chấm điểm

**Score Card (hiển thị sau mỗi câu):**
```
Band Score Tổng:  [6.0 - 9.0]
├── Fluency & Coherence:    X.X
├── Lexical Resource:        X.X
├── Grammatical Range:       X.X
└── Pronunciation:           X.X

Nhận xét: [Chi tiết từng tiêu chí]
Điểm mạnh: [...]
Cần cải thiện: [...]
```

**Prompt cho Gemini (chấm nghiêm khắc):**
> You are a strict IELTS examiner. Score the following response according to official IELTS Speaking band descriptors. Do NOT inflate scores. A band 6 response should score 6.0, not 7.0. Be specific about weaknesses.

**Actions sau khi chấm:**
- [Xem câu trả lời mẫu] → Gemini tạo sample answer band 8.0
- [Lưu từ vựng hay] → Lưu vào Review section
- [Lưu idiom] → Lưu vào Review section
- [Export PDF phiên này] → PDF đầy đủ Q&A + score + sample

---

### Phần 3 — IELTS Mock Test

**Flow giống examiner thật:**
1. Intro như thi thật (AI đóng vai examiner)
2. Part 1: ~4-5 câu hỏi cá nhân
3. Part 2: Cue card 1 phút chuẩn bị + 2 phút nói
4. Part 3: ~4-5 câu hỏi thảo luận
5. Chấm điểm tổng sau khi hoàn thành toàn bộ

**Điểm tổng kết:**
```
Estimated IELTS Band: X.X
(Kèm disclaimer: đây là ước tính AI, không phải kết quả thi chính thức)
```

**Prompt nghiêm khắc hơn Phần 2**, yêu cầu Gemini calibrate theo distribution thực tế của IELTS.

---

### Dashboard

**Heatmap:**
- GitHub-style contribution heatmap (365 ngày)
- Màu: ngày không luyện (gray) → luyện ít (light blue) → nhiều (dark blue/cyan)
- Hover tooltip: "15/04/2026 — 3 bài luyện tập"

**Leaderboard tháng:**
- Top 10 users có nhiều phút luyện tập nhất trong tháng
- Avatar, tên, số bài đã làm, total time
- Badge: 👑 #1, 🥈 #2, 🥉 #3

**Stats Cards:**
- Streak hiện tại (🔥)
- Tổng số bài đã làm
- Band score trung bình (30 ngày gần nhất)
- Thời gian luyện tập tuần này

**Tính năng sáng tạo:**
- "Pronunciation Weak Points" chart: top 5 âm hay phát âm sai
- "Vocabulary Growth" graph: số từ mới học theo tuần
- "Band Score Progress" line chart theo thời gian
- Daily challenge: 1 câu hỏi IELTS mỗi ngày, làm được + streak bonus

---

### Token & Premium System

**Free tier:**
- 30 tokens/tháng (reset ngày 1 hàng tháng)
- 1 token = 1 lần làm bài (Part 2/3) hoặc 1 lượt chơi game (Part 1)
- Lives: 5 mạng, hồi 1/30 phút

**Premium plans (VND):**
| Gói | Giá | Tiết kiệm |
|-----|-----|-----------|
| 1 tháng | 100,000đ | — |
| 2 tháng | 180,000đ | 10% |
| 3 tháng | 240,000đ | 20% |

Premium benefits: unlimited tokens, unlimited lives, priority AI scoring, advanced analytics

**Token deduction logic** (lib/tokens.ts):
- Kiểm tra premium trước → nếu có, không trừ token
- Nếu free, kiểm tra token > 0 → trừ 1 token → cho phép
- Nếu token = 0 → hiện paywall modal

---

### Share & Earn (Referral System)

**Flow:**
1. User bấm nút "Chia sẻ nhận quà" → hiện unique referral link
2. Copy link / chia sẻ qua mạng xã hội
3. Bạn bè đăng ký qua link → `referredBy` được ghi nhận
4. Bạn bè hoàn thành 1 session luyện tập → `hasUsedApp = true`
5. Khi đủ 5 bạn bè hợp lệ → tặng 15 ngày premium

**Validation:**
- Bạn bè phải là user mới (chưa có tài khoản)
- Phải hoàn thành ít nhất 1 session luyện tập (không chỉ đăng ký)
- Tự refer không được tính

**UI:**
- Progress bar: "3/5 bạn bè đã luyện tập"
- Danh sách trạng thái từng bạn bè (ẩn email, chỉ show initials)

---

### Review Section

**Saved vocabulary & idioms:**
- List cards với: từ/cụm từ, nghĩa, ví dụ, context (câu hỏi IELTS liên quan)
- Filter theo topic, loại (vocab/idiom/sample)
- Flashcard mode để ôn tập
- Export PDF đẹp: in ra như vocabulary notebook

---

## AI Prompt Guidelines

### Gemini — Chấm điểm IELTS (QUAN TRỌNG)
```
System: You are a certified IELTS examiner with 10+ years experience.
Score strictly according to IELTS Speaking Band Descriptors (official).
Score distribution guideline:
- Band 9: Native-like, near-perfect (very rare, <1% of test-takers)
- Band 7-8: Fluent with minor errors
- Band 5-6: Communicates but with noticeable errors/hesitation
- Band 4-5: Limited range, frequent errors
DO NOT give band 8+ unless the response genuinely merits it.
Return JSON: { overall, fluency, lexical, grammar, pronunciation, feedback, strengths, improvements }
```

### Gemini — Tạo câu hỏi IELTS
```
Generate [n] IELTS Speaking Part [1/2/3] questions about topic: [topic].
Questions must match official IELTS difficulty and style.
For Part 2, include a cue card format with bullet points.
Return JSON array of question objects.
```

### Gemini — Sample Answer
```
Write a band 8.0 IELTS Speaking sample answer for: [question]
Length: [Part 1: 2-3 sentences | Part 2: 2 minutes speech | Part 3: 3-4 sentences]
Include: varied vocabulary, discourse markers, complex grammar, natural fillers.
```

### Deepgram — TTS config
```typescript
// Giọng examiner chuyên nghiệp
model: "aura-asteria-en"  // hoặc "aura-orion-en" cho giọng nam
encoding: "mp3"
sample_rate: 24000
```

---

## Trang & Routes

| Route | Mô tả | Auth |
|-------|--------|------|
| `/` | Homepage (dark navy, marketing) | No |
| `/pricing` | Bảng giá premium | No |
| `/login` | Đăng nhập | No |
| `/register` | Đăng ký | No |
| `/dashboard` | Dashboard chính | Yes |
| `/learn` | Bản đồ chặng đường Beginner | Yes |
| `/learn/lesson/[id]` | Bài học vocab/grammar | Yes |
| `/learn/speak/[id]` | Luyện nói topic nhỏ | Yes |
| `/practice` | Chọn topic IELTS Practice | Yes |
| `/practice/session/[id]` | Phiên luyện tập | Yes |
| `/mock-test` | IELTS Mock Test setup | Yes |
| `/mock-test/session/[id]` | Phiên thi thử | Yes |
| `/review` | Ôn tập vocab/idioms | Yes |
| `/profile` | Hồ sơ & cài đặt | Yes |
| `/premium` | Nâng cấp premium | Yes |

---

## Component Conventions

- Tất cả components dùng **TypeScript strict mode**
- Dùng `'use client'` chỉ khi cần interactivity
- Server Components mặc định cho data fetching
- Loading states: dùng Suspense + skeleton components
- Error states: Error boundaries tại route level
- Tất cả màu sắc dùng CSS variables (để hỗ trợ dark/light mode)

```typescript
// Pattern cho AI API calls
async function callGemini(prompt: string): Promise<ScoringResult> {
  // Dùng gemini-2.0-flash cho tốc độ nhanh hơn
  // Fallback sang groq nếu gemini timeout > 10s
  // Always parse JSON response, validate schema
}
```

---

## Coding Rules

1. Không tự ý thêm tính năng ngoài spec
2. Mọi API call đến AI phải có timeout + fallback
3. Token deduction phải atomic (database transaction)
4. Lives regeneration tính theo server time, không client time
5. Referral validation phải server-side
6. Không lưu audio recordings dài hạn — chỉ process rồi xóa
7. Rate limiting trên mọi API route (đặc biệt /api/ai/*)
8. Validate tất cả input từ client trước khi gửi lên AI
