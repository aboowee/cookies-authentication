/* In middleware/cookieParser.js, write a middleware function that will access the cookies on an incoming request, parse them into an object, and assign this object to a cookies property on the request. */

//https://www.geeksforgeeks.org/express-js-req-cookies-property/

//here's the documentation for cookie parser.......
//http://www.senchalabs.org/connect/cookieParser.html

//https://www.geeksforgeeks.org/how-to-parse-http-cookie-header-and-return-an-object-of-all-cookie-name-value-pairs-in-javascript/
const parseCookies = (req, res, next) => {

  let cookieResponse = {};

  if (req.headers.cookie) {
    const separatedCookie = req.headers.cookie.split('; ');
    separatedCookie.forEach((cookie) => {
      var pair = cookie.split('=');
      cookieResponse[pair[0]] = pair[1];
    });
  }
  req.cookies = cookieResponse;
  // console.log('This is cookies', cookieResponse);
  next();
};
module.exports = parseCookies;