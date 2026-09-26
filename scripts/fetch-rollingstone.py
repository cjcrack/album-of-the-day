#!/usr/bin/env python3
import json, re, urllib.request
from html.parser import HTMLParser
from urllib.parse import urljoin

BASE = "https://www.rollingstone.de/rolling-stone-die-500-besten-alben-aller-zeiten-2681047/"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; AlbumOfTheDay/1.0)"}

def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "ignore")

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack=[]
        self.items=[]
        self.current=None
        self.capture=None
        self.links=[]
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        self.stack.append(tag)
        if tag=="a" and attrs.get("href"):
            self.links.append(urljoin(BASE, attrs["href"]))
        if tag in ("h2","h3","h4"):
            self.capture=tag
            self.text=[]
    def handle_endtag(self, tag):
        if self.capture==tag:
            value=" ".join(" ".join(self.text).split())
            if self.current is None:
                self.current={}
            if tag=="h2": self.current["artist"]=value
            elif tag=="h3": self.current["title"]=value
            elif tag=="h4": self.current["details"]=value
            if all(k in self.current for k in ("artist","title","details")):
                self.items.append(self.current)
                self.current=None
            self.capture=None
        if self.stack:
            self.stack.pop()
    def handle_data(self, data):
        if self.capture:
            self.text.append(data)

def parse_page(url):
    p=PageParser()
    p.feed(fetch(url))
    out=[]
    # Find rank numbers from the page text around each item using a second lightweight regex.
    html=fetch(url)
    # Headings appear in order; extract artist/title/details from the parser.
    for item in p.items:
        m=re.search(r"^(.*?),\s*(\d{4})$", item["details"])
        if m:
            label=m.group(1).strip()
            year=int(m.group(2))
        else:
            m=re.search(r"(\d{4})$", item["details"])
            year=int(m.group(1)) if m else None
            label=item["details"][:m.start()].strip(" ,") if m else item["details"]
        out.append({"artist":item["artist"],"title":item["title"],"year":year,"label":label})
    # Recover ranks from page text by looking for lines/nodes is difficult with HTMLParser;
    # instead parse visible text blocks in order.
    text=re.sub(r"<[^>]+>"," ",html)
    text=re.sub(r"\s+"," ",text)
    ranks=[int(x) for x in re.findall(r"(?:^|\s)([0-9]{1,3})(?=\s+[A-ZÄÖÜ])", text)]
    # Keep only plausible ranking range and assign sequentially by page order.
    ranks=[r for r in ranks if 1<=r<=500]
    # Deduplicate while preserving order.
    rr=[]
    for r in ranks:
        if not rr or rr[-1]!=r: rr.append(r)
    if len(rr) >= len(out):
        rr=rr[:len(out)]
        for a,r in zip(out,rr): a["rank"]=r
    return out, p.links

def main():
    first=fetch(BASE)
    # The site exposes pagination links 1..22 in the article footer.
    urls=[BASE]
    for n in range(2,23):
        urls.append(f"{BASE}{n}/")
    all_items=[]
    for u in urls:
        try:
            items,_=parse_page(u)
            all_items.extend(items)
            print(u, len(items))
        except Exception as e:
            print("ERROR",u,e)
    # Some pages may parse duplicated/related headings. Filter to valid ranked records.
    all_items=[x for x in all_items if "rank" in x and 1<=x["rank"]<=500]
    by_rank={x["rank"]:x for x in all_items}
    result=[by_rank[k] for k in sorted(by_rank, reverse=True)]
    if len(result)<450:
        raise SystemExit(f"Only {len(result)} ranked albums extracted; refusing to publish incomplete data.")
    if len(result)!=500:
        print(f"WARNING: extracted {len(result)} unique ranks")
    with open("data/albums.json","w",encoding="utf-8") as f:
        json.dump(result,f,ensure_ascii=False,indent=2)
    print("Wrote",len(result),"albums")

if __name__=="__main__":
    main()
