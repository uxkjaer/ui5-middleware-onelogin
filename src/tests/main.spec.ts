import test, { expect } from '@playwright/test';
import CookieGetter from '../cookieGetter';
import dotenv from 'dotenv';
dotenv.config();

const getCookie = async (url: string, endUrl?: string) => {
  const cookieStr = await new CookieGetter().getCookie(url, endUrl);
  return cookieStr;
};

test('Login to SapDevCenter', async () => {
  const cookieStr: any = await getCookie(process.env.UI5_MIDDLEWARE_ONELOGIN_LOGIN_URL);
  expect(JSON.parse(cookieStr).find((cookie: any) => cookie.name === 'MYSAPSSO2')).toBeDefined();
});

test('Login to AzureAD', async () => {
  process.env.UI5_MIDDLEWARE_ONELOGIN_LOGIN_URL = process.env.UI5_MIDDLEWARE_ONELOGIN_AZURE_LOGIN_URL;
  process.env.UI5_MIDDLEWARE_ONELOGIN_USERNAME = process.env.UI5_MIDDLEWARE_ONELOGIN_AZURE_USERNAME;
  process.env.UI5_MIDDLEWARE_ONELOGIN_PASSWORD = process.env.UI5_MIDDLEWARE_ONELOGIN_AZURE_PASSWORD;
  const cookieStr: any = await getCookie(process.env.UI5_MIDDLEWARE_ONELOGIN_LOGIN_URL);
  expect(cookieStr).toBeDefined();
});

test('Login to Google', async () => {
  process.env.UI5_MIDDLEWARE_ONELOGIN_LOGIN_URL = process.env.UI5_MIDDLEWARE_ONELOGIN_GOOGLE_LOGIN_URL;
  process.env.UI5_MIDDLEWARE_ONELOGIN_USERNAME = process.env.UI5_MIDDLEWARE_ONELOGIN_GOOGLE_USERNAME;
  process.env.UI5_MIDDLEWARE_ONELOGIN_PASSWORD = process.env.UI5_MIDDLEWARE_ONELOGIN_GOOGLE_PASSWORD;
  const cookieStr: any = await getCookie(process.env.UI5_MIDDLEWARE_ONELOGIN_LOGIN_URL);
  expect(cookieStr).toBeDefined();
});
