import re
import os
import time
import requests
from tqdm import tqdm
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
from requests.exceptions import RequestException

os.makedirs("../data/signs/", exist_ok=True)

xml = ET.parse("data/signs/sitemap.xml")
nsmp = {"doc": "http://www.sitemaps.org/schemas/sitemap/0.9"}

urls = [url.find("doc:loc", namespaces=nsmp).text for url in xml.findall("doc:url", namespaces=nsmp) if "/word/" in url.find("doc:loc", namespaces=nsmp).text]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Referer": "https://www.handspeak.com/",
}

all_words = []
bar = tqdm(total=len(urls), desc="Scraping Handspeak Videos")
for url in urls:
    try:
        time.sleep(1) 

        r = requests.get(url, headers=headers, timeout=10)
        r.raise_for_status()
        soup = BeautifulSoup(r.content, "html.parser")

        title = soup.find("title").text.lower()
        word = title.split(" • ")[0].strip()

        if " " in word or word in all_words:
            continue

        video_elem = soup.find("video")
        if not video_elem or "src" not in video_elem.attrs:
            continue
        video_rel_path = video_elem["src"]
        video_url = f"https://www.handspeak.com{video_rel_path}"
        print(f"Downloading {word} from {video_url}")

        if "-fs" in video_url or not video_url.endswith(".mp4"):
            continue

        word_dir = f"../data/signs/{word}"
        os.makedirs(word_dir, exist_ok=True)
        video_path = f"{word_dir}/{word}.mp4"

        with requests.get(video_url, headers=headers, stream=True, timeout=10) as response:
            response.raise_for_status()
            with open(video_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk: 
                        f.write(chunk)

        all_words.append(word)

    except RequestException as e:
        print(f"Error processing {url}: {e}")
        continue
    except Exception as e:
        print(f"Unexpected error processing {url}: {e}")
        continue

bar.close()
print(f"Downloaded videos for {len(all_words)} unique words into ../data/signs/")