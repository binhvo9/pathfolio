# Onboarding UI — screen flow

Low-fi wireframe, 7 screens. Beginner-friendly wording — questions are
posed as situations, not finance jargon (e.g. "if your portfolio drops
20%, what do you do?" instead of "what is your risk tolerance?").

```
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│   1. Welcome         │   │   2. Sign in         │   │  3. Goal             │
│                      │   │                      │   │                     │
│ "Chào, mình giúp bạn│──>│  [ Sign in Google ]  │──>│ Bạn tiết kiệm để     │
│  bắt đầu đầu tư đơn  │   │  [ Sign in GitHub ]  │   │ làm gì?             │
│  giản, dễ hiểu."     │   │                      │   │ ○ Hưu trí            │
│  [ Bắt đầu ]         │   │                      │   │ ○ Mua nhà            │
└─────────────────────┘   └─────────────────────┘   │ ○ Tăng trưởng chung  │
                                                       │           [ Tiếp ]  │
                                                       └─────────────────────┘
                                                                  │
        ┌─────────────────────────────────────────────────────────┘
        v
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│  4. Time horizon     │   │ 5. Risk tolerance    │   │ 6. Income need       │
│                      │   │                      │   │                     │
│ Bao lâu nữa bạn cần  │──>│ Nếu portfolio giảm   │──>│ Bạn có cần tiền này  │
│ dùng tới tiền này?   │   │ 20% trong 1 tháng,   │   │ trả đều hàng tháng   │
│ [slider: 1-30 năm]   │   │ bạn sẽ làm gì?        │   │ không, hay để yên    │
│           [ Tiếp ]   │   │ ○ Bán hết             │   │ cho nó lớn?         │
└─────────────────────┘   │ ○ Bán bớt             │   │ ○ Cần đều đặn        │
                           │ ○ Không làm gì         │   │ ○ Bình thường        │
                           │ ○ Mua thêm             │   │ ○ Để lớn dần         │
                           │           [ Tiếp ]     │   │           [ Xem KQ ] │
                           └─────────────────────┘   └─────────────────────┘
                                                                  │
        ┌─────────────────────────────────────────────────────────┘
        v
┌───────────────────────────────────────────────┐
│  7. Kết quả — Default Allocation                │
│                                                  │
│  Hồ sơ của bạn: Balanced · Balanced income      │
│                                                  │
│  ▓▓▓▓▓▓▓▓░░░░░░  Stocks 40%                     │
│  ▓▓▓▓▓░░░░░░░░  Bonds 30%                       │
│  ▓▓░░░░░░░░░░░  Cash 10%                        │
│  ▓░░░░░░░░░░░░  Crypto 5%                       │
│  ▓░░░░░░░░░░░░  Gold 5%                         │
│  ▓▓░░░░░░░░░░░  Real Estate 10%                 │
│                                                  │
│              [ Vào Dashboard ]                  │
└───────────────────────────────────────────────┘
```

Maps to: screens 3–6 = the 4 questions from `docs/specs/02-risk-questionnaire.md`;
screen 7 = the result from `docs/specs/03-allocation-engine.md`. This is
the throwaway low-fi version — Phase 8 (Behance case study) produces the
polished Figma version of this same flow later.
