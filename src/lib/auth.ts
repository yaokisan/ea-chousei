import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { sql } from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        // ユーザーが存在するか確認
        const existingUser = await sql`
          SELECT id FROM users WHERE email = ${user.email}
        `;

        if (existingUser.rows.length === 0) {
          // 新規ユーザーを作成
          await sql`
            INSERT INTO users (email, name, image)
            VALUES (${user.email}, ${user.name || ''}, ${user.image || null})
          `;
        } else {
          // 既存ユーザーの情報を更新
          await sql`
            UPDATE users
            SET name = ${user.name || ''}, image = ${user.image || null}
            WHERE email = ${user.email}
          `;
        }

        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      if (user?.email) {
        try {
          const dbUser = await sql`
            SELECT id FROM users WHERE email = ${user.email}
          `;
          if (dbUser.rows.length > 0) {
            token.userId = dbUser.rows[0].id;
          }
        } catch (error) {
          console.error('Error fetching user in jwt callback:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.userId as string;
        (session as { accessToken?: string }).accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  trustHost: true,
});
