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
- **Font CJK**: Noto Sans SC/JP/KR nạp qua Google Fonts; `<body data-lang>` chọn font đúng.
- **Đổi ngôn ngữ**: nút 🌐 trên navbar (hoặc thẻ chọn ở trang chủ). Lưu vào cookie `dds_lang` + `User.learningLanguage`.

## Cần tự bổ sung nội dung (không bắt buộc để chạy)

- **Lộ trình "Learn" cơ bản** (`/learn`) cho zh/ja/ko hiện **trống** vì bài học (`Stage`/`CustomLesson`) tách theo `language`. Tạo nội dung trong **Admin → Stages / Lessons** (đã có ô chọn ngôn ngữ + sinh bằng AI), hoặc viết seed script tương tự `scripts/seed-*.ts` có truyền `language`.
- **TTS (đọc câu hỏi)** cho zh/ja/ko: hiện **chưa có** (Deepgram Aura chỉ tiếng Anh) — câu hỏi hiển thị dạng chữ. Muốn có giọng đọc thì tích hợp TTS cloud (Google/Azure) trong `app/api/speech/tts/route.ts` + map giọng trong `lib/languages.ts` (`ttsVoice`).

## Lưu ý khác

- `next.config.ts`: đã **bỏ** rewrite Multi-Zones `/ja`, `/zh` (trước trỏ sang deployment riêng) vì giờ là 1 app.
- Chấm phát âm dựa trên transcript (text) nên với thanh điệu (Trung)/cao độ (Nhật)/batchim (Hàn) chỉ mang tính tham khảo.
- Nội dung mẫu (prompt luyện nói trong `/learn/speak`, chủ đề) do AI/biên tập tạo — nên nhờ người bản ngữ rà lại trước khi phát hành.
