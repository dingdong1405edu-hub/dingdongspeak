# Đa ngôn ngữ (EN / 中文 / 日本語 / 한국어) — Ghi chú triển khai

App đã được chuyển từ "chỉ tiếng Anh/IELTS" sang **một app đa ngôn ngữ**: người dùng chọn ngôn ngữ luyện tập (Anh/Trung/Nhật/Hàn) ngay trong app, giao diện vẫn tiếng Việt. Xem mục "Kiến trúc đa ngôn ngữ" trong `CLAUDE.md`.

## ⚠️ BẮT BUỘC trước khi chạy thật: cập nhật database

Schema Prisma đã thêm cột `language` (vào `PracticeSession`, `SharedAnswer`, `SavedItem`, `Stage`, `CustomLesson`) và `User.learningLanguage` — tất cả mặc định `"en"` nên **dữ liệu cũ vẫn hợp lệ**. Phải đẩy schema lên DB:

```bash
# Cần biến môi trường DATABASE_URL (Railway Postgres)
npx prisma generate
npx prisma db push
```

> Nếu không chạy `db push`, các truy vấn lọc theo `language` sẽ lỗi runtime (cột chưa tồn tại). Dự án không dùng thư mục `migrations/` — schema áp dụng bằng `db push`.

## Những gì hoạt động ngay cho ngôn ngữ mới (zh/ja/ko)

- **Luyện nói** (`/practice`) và **Thi thử** (`/mock-test`): câu hỏi, câu mẫu, từ vựng, chấm điểm đều do AI sinh theo ngôn ngữ đích (Groq Llama). Nhận xét/nghĩa giữ tiếng Việt.
- **Ghi âm → nhận dạng (STT)**: Deepgram `nova-2` cho zh/ja/ko (tiếng Anh dùng `nova-3`).
- **Thang điểm**: tiếng Anh = Band 0–9 (IELTS); Trung/Nhật/Hàn = 0–100. Tự đổi nhãn/màu theo `lib/languages.ts`.
- **TTS (đọc đề + phát âm từ vựng)**: tiếng Anh (Deepgram Aura) và **tiếng Nhật (Deepgram Aura-2, giọng `aura-2-uzume-ja`)**. Trung/Hàn **chưa có** TTS (Deepgram chưa hỗ trợ tiếng Trung/Hàn) → `/api/speech/tts` trả 204, câu hỏi hiển thị dạng chữ. Giọng lấy từ `ttsVoice` trong `lib/languages.ts`.
- **Font CJK**: Noto Sans SC/JP/KR nạp qua Google Fonts; `<body data-lang>` chọn font đúng.
- **Đổi ngôn ngữ**: nút 🌐 trên navbar (hoặc thẻ chọn ở trang chủ). Lưu vào cookie `dds_lang` + `User.learningLanguage`.

## Nội dung lộ trình "Learn" cho Trung / Nhật / Hàn (đã seed sẵn)

Lộ trình **Learn** (`/learn`) đọc `Stage` + `CustomLesson` lọc theo `language`. Bộ nội dung **Trung (zh)**, **Nhật (ja)** và **Hàn (ko)** đã được tạo sẵn (native, kèm pinyin/furigana+romaji/romaja, nghĩa & gợi ý tiếng Việt) trong `scripts/seed-data/`:

- `scripts/seed-data/curriculum-{zh,ja,ko}.json` — định nghĩa stage + bài học (zh & ko: 6 stage × 6 bài, HSK1–4 / TOPIK1–3; ja: 4 stage × 6 bài, N5–N4). Mỗi bài là từ vựng / ngữ pháp / luyện nói.
- `scripts/seed-data/<zh|ja|ko>/<lessonKey>.json` — thẻ (cards) đã sinh sẵn cho từng bài.

**Khi deploy, Railway tự seed**: `railway.toml` có `preDeployCommand` chạy `prisma db push` + `node scripts/seed-multilang.mjs` mỗi lần deploy (idempotent).

Chạy thủ công (cần `DATABASE_URL`):

```bash
npx prisma db push                       # tạo cột language (deploy tự chạy)
node scripts/seed-multilang.mjs          # seed zh + ja + ko
# hoặc một ngôn ngữ: node scripts/seed-multilang.mjs zh
```

Muốn thêm bài: bổ sung lesson vào `curriculum-<lang>.json`, tạo file thẻ tương ứng trong `scripts/seed-data/<lang>/`, rồi chạy lại seed. Hoặc tạo trực tiếp trong **Admin → Stages / Lessons** (có ô chọn ngôn ngữ + sinh bằng AI).

- **TTS tiếng Trung/Hàn**: muốn có giọng đọc đề cho zh/ko thì tích hợp TTS cloud khác (Google/Azure) trong `app/api/speech/tts/route.ts` + map giọng trong `lib/languages.ts` (`ttsVoice`); Deepgram hiện chỉ có giọng cho Anh & Nhật.

## Lưu ý khác

- `next.config.ts`: đã **bỏ** rewrite Multi-Zones `/ja`, `/zh` (trước trỏ sang deployment riêng) vì giờ là 1 app.
- Chấm phát âm dựa trên transcript (text) nên với thanh điệu (Trung)/cao độ (Nhật)/batchim (Hàn) chỉ mang tính tham khảo.
- Nội dung mẫu (prompt luyện nói trong `/learn/speak`, chủ đề) do AI/biên tập tạo — nên nhờ người bản ngữ rà lại trước khi phát hành.
