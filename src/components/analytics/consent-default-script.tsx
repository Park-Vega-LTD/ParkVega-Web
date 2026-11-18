import Script from "next/script";

import { CONSENT_COOKIE, CONSENT_VERSION } from "@/lib/analytics/consent";
import { ALLOWED_QUERY_PARAMS, REDACTED_PATHS } from "@/lib/analytics/privacy";

/**
 * Runs before any other script on every page:
 *  1. creates the dataLayer and the `gtag` shim;
 *  2. sets Google Consent Mode v2 to "denied" for everything optional;
 *  3. applies a stored choice from the `pv_consent` cookie, so returning
 *     visitors are measured from their first page;
 *  4. sets a redacted page_location / page_referrer so no Google tag sees a
 *     booking code or payment query string.
 *
 * GTM itself is only loaded later, and only after consent (analytics-scripts.tsx).
 * The URL rules are passed in from privacy.ts so there is one source of truth.
 */
export function ConsentDefaultScript() {
  const code = `(function(){
var w=window,d=document;w.dataLayer=w.dataLayer||[];
if(!w.gtag){w.gtag=function(){w.dataLayer.push(arguments);};}
var g=w.gtag;
g('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});
g('set','ads_data_redaction',true);
g('set','url_passthrough',false);
var V=${JSON.stringify(CONSENT_VERSION)},N=${JSON.stringify(CONSENT_COOKIE)};
var m=d.cookie.match(new RegExp('(?:^|; )'+N+'=([^;]*)'));
if(m){var p=decodeURIComponent(m[1]).split('|');
if(p[0]===V&&(p[1]==='0'||p[1]==='1')&&(p[2]==='0'||p[2]==='1')){
var a=p[1]==='1'?'granted':'denied',k=p[2]==='1'?'granted':'denied';
g('consent','update',{analytics_storage:a,ad_storage:k,ad_user_data:k,ad_personalization:k});}}
var R=${JSON.stringify(REDACTED_PATHS)},Q=${JSON.stringify(ALLOWED_QUERY_PARAMS)};
function rp(x){for(var i=0;i<R.length;i++){var re=new RegExp(R[i].pattern);if(re.test(x))return x.replace(re,R[i].replacement);}return x;}
function rs(s){var i=new URLSearchParams(s),o=new URLSearchParams();Q.forEach(function(q){var v=i.get(q);if(v)o.set(q,v.slice(0,200));});var t=o.toString();return t?'?'+t:'';}
function ru(h){try{var u=new URL(h);return u.origin+rp(u.pathname)+rs(u.search);}catch(e){return '';}}
var ref='';try{if(d.referrer){var r=new URL(d.referrer);ref=r.origin===location.origin?ru(d.referrer):r.origin+'/';}}catch(e){}
g('set',{page_location:ru(location.href),page_referrer:ref,page_path:rp(location.pathname)});
})();`;

  return (
    // Next 16 supports beforeInteractive in the App Router root layout (this
    // component is only rendered there); the lint rule predates that.
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script id="pv-consent-default" strategy="beforeInteractive">
      {code}
    </Script>
  );
}
