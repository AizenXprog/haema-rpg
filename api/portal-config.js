// Vercel serverless function; only publishable Supabase details are returned.
// Never expose service_role or private API credentials to the browser.
module.exports = function handler(req,res){
 res.setHeader('Cache-Control','no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');
 const url=process.env.HAEMA_SUPABASE_URL||'';
 const key=process.env.HAEMA_SUPABASE_PUBLISHABLE_KEY||'';
 const safeUrl=/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url);
 const safeKey=/^(sb_publishable_[a-zA-Z0-9_-]+|eyJ[A-Za-z0-9_=-]+\.[A-Za-z0-9_=-]+\.[A-Za-z0-9_=-]+)$/.test(key);
 res.status(200).json({configured:!!(safeUrl&&safeKey),url:safeUrl?url:'',publishableKey:safeUrl&&safeKey?key:''});
};
