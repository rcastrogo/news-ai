import requests
from bs4 import BeautifulSoup
from .log_utils import log_message

def fetch_page(url):
    log_message(f"Fetching page: {url}")
    response = requests.get(url)
    if response.status_code == 200:
        try:
            soup = BeautifulSoup(response.text, 'html.parser')
        
            title = soup.title.string if soup.title else "No title"
            text = ""
            if soup.body:
                elementos = soup.body.find_all(['p'])
                text = "\n".join([el.get_text(strip=True) for el in elementos])
            return {
                "title": title,
                "text-content": text
            }
        except requests.exceptions.RequestException as e:
            log_message(f"Error fetching page {url}: {e}")
    else:
        log_message(f"Error al conectar: {response.status_code}")

    return ""