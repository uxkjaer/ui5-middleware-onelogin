import { chromium } from 'playwright';
import sleep from 'sleep-promise';
import {Options} from "./types";


interface Attributes {
  url: string
  username: string,
  password: string
}
export default class CookieGetter {
  async getCookie(options: Options): Promise<string> {
    const attr : Attributes = {
      url: (options.configuration && options.configuration.path) ? options.configuration.path : process.env.UI5_MIDDLEWARE_ONELOGIN_LOGIN_URL!,
      username: (options.configuration && options.configuration.username) ? options.configuration.username : process.env.UI5_MIDDLEWARE_ONELOGIN_USERNAME!,
      password: (options.configuration && options.configuration.password) ? options.configuration.password : process.env.UI5_MIDDLEWARE_ONELOGIN_PASSWORD!,
    }
    const browser = await chromium.launch({
      headless: (options) ? !options.configuration.debug : true,
      args: ['--disable-dev-shm-usage']
    });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });

    const page = await context.newPage();

    await page.goto(attr.url, { waitUntil: 'domcontentloaded' });
    let elem;
    try{
       elem = await Promise.race([
        page.waitForSelector('input[type="email"]'),
        page.waitForSelector('input[type="username"]'),
        page.waitForSelector('input[name="sap-user"]')
      ]);
    }
    catch (oError) {
      elem = await page.waitForSelector('input[type="text"]')
    }
    
    let password = page.locator('input[type="password"]');
    let isHidden = await password.getAttribute('aria-hidden');
    await elem.type(attr.username);
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
          page.waitForSelector('text="Yes"')
        ]);
        //@ts-ignore

        await buttonLocator.click({ waitUntil: 'networkidle' });
        await sleep(1000)
      }
    }
    while (!!isHidden) {
      await sleep(2000);

      isHidden = await password.getAttribute('aria-hidden');
    }
    await password.type(attr.password);
    try {
      await page.waitForSelector('*[type="submit"]', { timeout: 500 });
      //@ts-ignore
      await page.click('*[type="submit"]', { waitUntil: 'networkidle' });
    } catch (oError) {
      const buttonLocator = await Promise.race([
        page.waitForSelector('text="Next"'),
        page.waitForSelector('text="Submit"'),
        page.waitForSelector('text="Yes"'),
        page.waitForSelector('//*[@id="LOGON_BUTTON"]')
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
