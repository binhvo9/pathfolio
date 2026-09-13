import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";

// AuthModule (docs/diagrams/c4/component-onboarding.md) — session handling
// via the NextAuth Prisma adapter. OAuth-only per REQUIREMENTS.md FR-ON-1;
// account matching is (provider, providerAccountId), not email, per
// docs/specs/01-auth-user-schema.md's edge-case note.
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google, GitHub],
  session: { strategy: "database" },
  events: {
    // New user created by the adapter -> give them an empty RiskProfile
    // right away, per docs/specs/01-auth-user-schema.md step 3. The
    // Onboarding UI checks for a null questionnaireCompletedAt to know
    // the user still needs to do the questionnaire.
    async createUser({ user }) {
      if (!user.id) return;
      await prisma.riskProfile.create({ data: { userId: user.id } });
    },
  },
});
