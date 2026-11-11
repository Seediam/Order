'use strict';
const {chromium}=require(process.env.ORDER_PLAYWRIGHT||'playwright');
const fs=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'..'),output=path.join(__dirname,'evidence');let server,browser,context;
(async()=>{
 server=http.createServer(async(q,r)=>{try{const file=path.join(root,new URL(q.url,'http://local').pathname==='/'?'index.html':new URL(q.url,'http://local').pathname);const bytes=await fs.readFile(file);r.writeHead(200,{'Content-Type':({'html':'text/html','js':'text/javascript','css':'text/css','png':'image/png','svg':'image/svg+xml'}[path.extname(file).slice(1)]||'application/octet-stream')});r.end(bytes)}catch{r.writeHead(404);r.end()}});
 await new Promise(resolve=>server.listen(4190,'127.0.0.1',resolve));browser=await chromium.launch({headless:true});context=await browser.newContext({viewport:{width:1366,height:768},recordVideo:{dir:path.join(output,'video'),size:{width:1366,height:768}}});
 const page=await context.newPage();page.setDefaultTimeout(5000);const base='http://127.0.0.1:4190/';
 await page.goto(base+'?preview=intro');await page.waitForTimeout(1600);await page.locator('.eye-button').click({force:true});await page.waitForTimeout(3200);
 await page.goto(base+'?preview=dialogue');await page.waitForTimeout(1700);await page.locator('.typewritten').click();await page.evaluate(()=>Cinematics.playLightFlicker());
 await page.goto(base+'?preview=combat');await page.waitForTimeout(750);await page.locator('.tile[data-value="3,2"]').click();await page.waitForTimeout(850);await page.locator('.card-item').nth(1).hover({force:true});await page.waitForTimeout(1200);
 const video=page.video();await context.close();context=null;await video.saveAs(path.join(output,'cinematics.webm'));await video.delete();console.log('Vídeo salvo em tests/evidence/cinematics.webm');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await context?.close();await browser?.close();server?.close()});
