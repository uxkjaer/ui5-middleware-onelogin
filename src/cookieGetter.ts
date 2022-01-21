import { chromium } from 'playwright';
import sleep from 'sleep-promise';
import {Options} from "./types";

export default class CookieGetter {
  async getCookie(url: string, options: Options): Promise<string> {
    const browser = await chromium.launch({
      headless: !options.configuration.debug,
      args: ['--disable-dev-shm-usage']
    });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });

    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const elem = await Promise.race([
      page.waitForSelector('input[type="email"]'),
      page.waitForSelector('input[type="username"]'),
      page.waitForSelector('input[type="text"]'),
    ]);
    const type = await elem.getAttribute('type');
    let password = page.locator('input[type="password"]');
    let isHidden = await password.getAttribute('aria-hidden');
    switch (type) {
      case 'email':
        await page.type('input[type="email"]', process.env.UI5_MIDDLEWARE_ONELOGIN_USERNAME!);
        break;
      case 'username':
        await page.type('input[type="username"]', process.env.UI5_MIDDLEWARE_ONELOGIN_USERNAME!);
        break;
      case 'text':
        await page.type('input[type="text"]', process.env.UI5_MIDDLEWARE_ONELOGIN_USERNAME!);
        break;
    }
    if (!!isHidden && isHidden !== null) {
      try {
        await page.click('input[type="submit"]', { timeout: 500 });
      } catch (oError) {
        //This can happen if we are using google
        const buttonLocator = await Promise.race([
          page.waitForSelector('text="Next"'),
          page.waitForSelector('text="Submit"'),
          page.waitForSelector('text="Yes"'),
          page.waitForSelector('text="Login"'),
          page.waitForSelector('text="Yes"'),
        ]);
        //@ts-ignore

        await buttonLocator.click({ waitUntil: 'networkidle' });
      }
    }
    while (!!isHidden) {
      await sleep(2000);

      isHidden = await password.getAttribute('aria-hidden');
    }
    await password.type(process.env.UI5_MIDDLEWARE_ONELOGIN_PASSWORD!);
    try {
      await page.waitForSelector('*[type="submit"]', { timeout: 500 });
      //@ts-ignore
      await page.click('*[type="submit"]', { waitUntil: 'networkidle' });
    } catch (oError) {
      const buttonLocator = await Promise.race([
        page.waitForSelector('text="Next"'),
        page.waitForSelector('text="Submit"'),
        page.waitForSelector('text="Yes"'),
        page.waitForSelector('text="Login"'),
        page.waitForSelector('text="Yes"'),
      ]);
      //@ts-ignore

      await buttonLocator.click({ waitUntil: 'networkidle' });
    }

    try {
      await page.waitForSelector('text="No"', { timeout: 2000 });
      if (await page.isVisible('text=Stay signed in?')) {
        //@ts-ignore
        await page.click('text="No"', endUrl ? {} : { waitUntil: 'networkidle' });
      }
    } catch (oError) {
      //This error is fine, it's not locating the No button specifically for Azure
    }

    const cookies = await context.cookies();
    browser.close();
    return JSON.stringify(cookies);
  }
}
