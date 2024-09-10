import { errMsg } from '../err-msg.js';
import { importMap } from '../features/import-maps.js';
import { systemJSPrototype } from '../system-core.js';

/*
 * Fetch loader, sets up shouldFetch and fetch hooks
 */
systemJSPrototype.shouldFetch = function () {
  return false;
};
if (typeof fetch !== 'undefined')
  systemJSPrototype.fetch = fetch;

var instantiate = systemJSPrototype.instantiate;
var jsContentTypeRegEx = /^(text|application)\/(x-)?javascript(;|$)/;
systemJSPrototype.instantiate = function (url, parent, meta) {
  window.Stopwatch.start('systemJSPrototype.instantiate url '+url);
  window.Stopwatch.start('systemJSPrototype.instantiate fetch '+url);
  window.Stopwatch.start('systemJSPrototype.instantiate fetch source '+url);
  var loader = this;
  if (!this.shouldFetch(url, parent, meta)){
    window.Stopwatch.stop('systemJSPrototype.instantiate url '+url);
    return instantiate.apply(this, arguments);
  }
  return this.fetch(url, {
    credentials: 'same-origin',
    integrity: importMap.integrity[url],
    meta: meta,
  })
  .then(function (res) {
    if (!res.ok)
      throw Error(errMsg(7, process.env.SYSTEM_PRODUCTION ? [res.status, res.statusText, url, parent].join(', ') : res.status + ' ' + res.statusText + ', loading ' + url + (parent ? ' from ' + parent : '')));
    var contentType = res.headers.get('content-type');
    if (!contentType || !jsContentTypeRegEx.test(contentType))
      throw Error(errMsg(4, process.env.SYSTEM_PRODUCTION ? contentType : 'Unknown Content-Type "' + contentType + '", loading ' + url + (parent ? ' from ' + parent : '')));
    window.Stopwatch.stop('systemJSPrototype.instantiate fetch source '+url);
    return res.text().then(function (source) {
      if (source.indexOf('//# sourceURL=') < 0)
        source += '\n//# sourceURL=' + url;
      window.Stopwatch.start('systemJSPrototype.instantiate eval source '+url);
      (0, eval)(source);
      window.Stopwatch.stop('systemJSPrototype.instantiate eval source '+url);
      window.Stopwatch.start('systemJSPrototype.instantiate getRegister '+url);
      var regResult = loader.getRegister(url);
      window.Stopwatch.stop('systemJSPrototype.instantiate getRegister '+url);
      return regResult;
    });
  });
};
