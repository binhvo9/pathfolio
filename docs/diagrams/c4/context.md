# C4 Context — PathFolio in the big picture

```
   +-----------+       onboards, builds       +---------------------------+
   |  Retail   | --------scenarios,----------> |        PathFolio         |
   | Investor  |         reads reports         |  robo-advisor simulator  |
   | (NZ, beg.)|                                |  (the whole system,      |
   +-----------+                                |   one box for now)      |
                                                 +---------------------------+
                                                   |       |       |      |
                                    fetches &      |       |       |      | sends
                                    caches prices   |       |       |      | PDF report
                                                    v       |       |      v
                                          +-----------+     |       |  +--------+
                                          |Market Data|     |       |  | Email  |
                                          | Provider  |     |       |  |Provider|
                                          +-----------+     |       |  +--------+
                                       requests comparison  |    verifies
                                       insight               v    login
                                                     +--------+ +----------+
                                                     | Gemini | |  OAuth   |
                                                     |(Google)| | Identity |
                                                     +--------+ +----------+
```

One actor (Retail Investor, NZ, beginner), one system box, four external
systems: Market Data Provider (prices), Google Gemini (comparison insight
— swapped from Claude/Anthropic 2026-09-12, since Anthropic's API has no
real free tier and this is a demo-scale personal project), OAuth Identity
Provider (login, now via NextAuth.js — see
`docs/specs/01-auth-user-schema.md`), Email Provider (delivers the
exported PDF report). No internal services shown yet — see the Container
diagram for that.
