"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const playwright_1 = require("playwright");
const sleep_promise_1 = __importDefault(require("sleep-promise"));
class CookieGetter {
    getCookie(url, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const isDebug = options.configuration.debug ? true : false;
            const browser = yield playwright_1.chromium.launch({ headless: isDebug ? true : false, args: ['--disable-dev-shm-usage'] });
            const context = yield browser.newContext({ ignoreHTTPSErrors: true });
            const page = yield context.newPage();
            yield page.goto(url, { waitUntil: 'domcontentloaded' });
            const elem = yield Promise.race([
                page.waitForSelector('input[type="email"]'),
                page.waitForSelector('input[type="username"]'),
                page.waitForSelector('input[type="text"]'),
            ]);
            const type = yield elem.getAttribute('type');
            let password = page.locator('input[type="password"]');
            let isHidden = yield password.getAttribute('aria-hidden');
            switch (type) {
                case 'email':
                    yield page.type('input[type="email"]', process.env.UI5_MIDDLEWARE_ONELOGIN_USERNAME);
                    break;
                case 'username':
                    yield page.type('input[type="username"]', process.env.UI5_MIDDLEWARE_ONELOGIN_USERNAME);
                    break;
                case 'text':
                    yield page.type('input[type="text"]', process.env.UI5_MIDDLEWARE_ONELOGIN_USERNAME);
                    break;
            }
            if (!!isHidden && isHidden !== null) {
                try {
                    yield page.click('input[type="submit"]', { timeout: 500 });
                }
                catch (oError) {
                    //This can happen if we are using google
                    const buttonLocator = yield Promise.race([
                        page.waitForSelector('text="Next"'),
                        page.waitForSelector('text="Submit"'),
                        page.waitForSelector('text="Yes"'),
                        page.waitForSelector('text="Login"'),
                        page.waitForSelector('text="Yes"'),
                    ]);
                    //@ts-ignore
                    yield buttonLocator.click({ waitUntil: 'networkidle' });
                }
            }
            while (!!isHidden) {
                yield (0, sleep_promise_1.default)(2000);
                isHidden = yield password.getAttribute('aria-hidden');
            }
            yield password.type(process.env.UI5_MIDDLEWARE_ONELOGIN_PASSWORD);
            try {
                yield page.waitForSelector('*[type="submit"]', { timeout: 500 });
                //@ts-ignore
                yield page.click('*[type="submit"]', { waitUntil: 'networkidle' });
            }
            catch (oError) {
                const buttonLocator = yield Promise.race([
                    page.waitForSelector('text="Next"'),
                    page.waitForSelector('text="Submit"'),
                    page.waitForSelector('text="Yes"'),
                    page.waitForSelector('text="Login"'),
                    page.waitForSelector('text="Yes"'),
                ]);
                //@ts-ignore
                yield buttonLocator.click({ waitUntil: 'networkidle' });
            }
            try {
                yield page.waitForSelector('text="No"', { timeout: 2000 });
                if (yield page.isVisible('text=Stay signed in?')) {
                    //@ts-ignore
                    yield page.click('text="No"', endUrl ? {} : { waitUntil: 'networkidle' });
                }
            }
            catch (oError) {
                //This error is fine, it's not locating the No button specifically for Azure
            }
            const cookies = yield context.cookies();
            browser.close();
            return JSON.stringify(cookies);
        });
    }
}
exports.default = CookieGetter;
//# sourceMappingURL=cookieGetter.js.map