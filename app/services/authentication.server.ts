import type { User } from '@prisma/client';
import { redirect } from 'remix';
import { Authenticator } from 'remix-auth';
import { FormStrategy } from 'remix-auth-form';
import invariant from 'tiny-invariant';
import { sessionStorage } from '~/services/cookieSession';
import { unauthorized } from '~/utils/response';
import { getToken } from './tokens.server';
import { getUser, getUserByUsernameAndPassword } from './users.server';

export const authenticator = new Authenticator<User>(sessionStorage);

export async function requireCookieAuth(request: Request): Promise<User> {
  const url = new URL(request.url);
  const failureRedirect = `/login?redirect_to=${encodeURI(url.pathname + url.search)}`;
  try {
    const userFromCookie = await authenticator.isAuthenticated(request, {
      failureRedirect,
    });
    return await getUser(userFromCookie.id);
  } catch (e) {
    throw redirect(failureRedirect);
  }
}

export async function requireTokenAuth(request: Request): Promise<User> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s/, '') ?? undefined;
  if (!token) {
    throw unauthorized();
  }
  try {
    const { userId } = await getToken(token);
    return await getUser(userId);
  } catch (error: any) {
    console.log('Token Auth Error: ', error?.constructor?.name);
    throw unauthorized();
  }
}

authenticator.use(
  new FormStrategy<User>(async ({ form }) => {
    const username = form.get('username');
    const password = form.get('password');
    invariant(username && typeof username === 'string', 'Missing username');
    invariant(password && typeof password === 'string', 'Missing password');
    const user = await getUserByUsernameAndPassword(username, password);
    if (!user) {
      throw unauthorized();
    }
    return user;
  }),
  'user-pass',
);