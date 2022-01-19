import cookieGetter from './cookieGetter';
const log = require('@ui5/logger').getLogger('server:custommiddleware:onelogin');
import dotenv from 'dotenv';
import { serialize } from 'cookie';
dotenv.config();

// interface cookieFace {
// name: string,
// key: string
// }
/**
 * Custom UI5 Server middleware example
 *
 * @param {Object} parameters Parameters
 * @param {Object} parameters.resources Resource collections
 * @param {module:@ui5/fs.AbstractReader} parameters.resources.
 *                                        all Reader or Collection to read resources of the
 *                                        root project and its dependencies
 * @param {module:@ui5/fs.AbstractReader} parameters.resources.
 *                                        rootProject Reader or Collection to read resources of
 *                                        the project the server is started in
 * @param {module:@ui5/fs.AbstractReader} parameters.resources.dependencies
 *                                        Reader or Collection to read resources of
 *                                        the projects dependencies
 * @param {Object} parameters.options Options
 * @param {string} [parameters.options.configuration] Custom server middleware configuration
 *                                                      if given in ui5.yaml
 * @returns {function} Middleware function to use
 */
// eslint-disable-next-line func-names
module.exports = function ({}) {
  // eslint-disable-next-line func-names
  return async function (_req: any, res: any, next: any) {
    let cookies = [];
    if (!process.env.UI5_MIDDLEWARE_ONELOGIN_LOGIN_URL) {
      next();
    } else if (!process.env.cookie) {
      // else {
      log.info('Fetching cookie, hang on!');
      const cookieObj = await new cookieGetter().getCookie(process.env.UI5_MIDDLEWARE_ONELOGIN_LOGIN_URL);
      cookies = JSON.parse(cookieObj);
      process.env.cookie = cookieObj;
    } else {
      cookies = JSON.parse(process.env.cookie);
    }

    let cookieStr: string = '';

    cookies
      .filter((cookieTemp: any) => !cookieTemp.name.includes('sap-contextid'))
      .forEach((cookie: any) => {
        //  cookie.domain = req.hostname
        cookie.key = cookie.name;
        delete cookie.expires;
        res.cookie(cookie.name, cookie.value, {
          maxAge: 86400 * 1000, // 24 hours
          httpOnly: true, // http only, prevents JavaScript cookie access
          secure: false, // cookie must be sent over https / ssl)
        });
        if (!process.env.UI5_MIDDLEWARE_HTTP_HEADERS) {
          cookieStr = cookieStr.concat(cookieStr, serialize(cookie.name, cookie.value, cookie), '; ');
        }
      });

    if (!process.env.UI5_MIDDLEWARE_HTTP_HEADERS) {
      let parsedUI5Headers = process.env.UI5_MIDDLEWARE_HTTP_HEADERS
        ? JSON.parse(process.env.UI5_MIDDLEWARE_HTTP_HEADERS)
        : {};

      parsedUI5Headers = Object.assign(parsedUI5Headers, { cookie: cookieStr });

      process.env.UI5_MIDDLEWARE_HTTP_HEADERS = JSON.stringify(parsedUI5Headers);
    }

    next();
  };
};
