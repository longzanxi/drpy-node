from playwright.sync_api import sync_playwright
import re

TARGET='https://www.libvio.site/play/714893137-4-1.html'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(ignore_https_errors=True, user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36')

    # Block heavy media segments to keep it fast
    def route_handler(route):
        url = route.request.url.lower()
        if any(url.endswith(ext) or (ext in url and url.split('?')[0].endswith(ext)) for ext in ['.ts','.m4s','.mp4','.mkv','.flv']):
            return route.abort()
        return route.continue_()

    context.route('**/*', route_handler)

    page = context.new_page()
    hits=[]
    def consider(u, kind):
        lu=u.lower()
        if any(x in lu for x in ['.m3u8','.vtt','.srt','.ass','subtitle','captions']):
            hits.append((kind,u))

    page.on('request', lambda req: consider(req.url,'req'))
    page.on('response', lambda res: consider(res.url,'res'))

    page.goto(TARGET, wait_until='domcontentloaded', timeout=90000)
    page.wait_for_timeout(10000)

    print('title', page.title())
    v = page.evaluate('() => window.player_aaaa')
    print('player_aaaa.from', v.get('from'), 'sid', v.get('sid'), 'nid', v.get('nid'))

    seen=set()
    for kind,u in hits:
        if u in seen: continue
        seen.add(u)
        print(kind, u)

    browser.close()
