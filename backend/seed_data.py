"""Seed catalog data for SOLEKICKS PK sneaker store."""
from datetime import datetime, timezone, timedelta

# Curated sneaker imagery (Unsplash / Pexels)
IMG = {
    "aj4": "https://images.unsplash.com/photo-1640016713197-76fe85053279?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "aj4b": "https://images.unsplash.com/photo-1612902377668-68ec50954ad9?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "dunk": "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "dunkb": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "runner": "https://images.unsplash.com/photo-1746206673199-5b75dcec1018?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "runnerb": "https://images.unsplash.com/photo-1587587448924-b5a1db520d29?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "slide": "https://images.pexels.com/photos/18110858/pexels-photo-18110858.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "slideb": "https://images.pexels.com/photos/16350687/pexels-photo-16350687.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "black": "https://images.unsplash.com/photo-1786379582186-83ef57a1c420?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "whitelow": "https://images.unsplash.com/photo-1559050993-d4e4fbf11769?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "adidas": "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "athletic": "https://images.pexels.com/photos/14212621/pexels-photo-14212621.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "eqt": "https://images.unsplash.com/photo-1597892657493-6847b9640bac?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "aj1": "https://images.unsplash.com/photo-1556906781-9a412961c28c?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "grayrun": "https://images.unsplash.com/photo-1562183241-b937e95585b6?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "yeezy": "https://images.unsplash.com/photo-1645106281638-79585657aa4e?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "retro": "https://images.pexels.com/photos/4061385/pexels-photo-4061385.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "street": "https://images.unsplash.com/photo-1641997465126-c73cc4070337?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
}

HERO_SLIDES = [
    {"title": "STREET REVOLUTION", "subtitle": "High-heat streetwear silhouettes & retro re-issues engineered for urban dominance across Pakistan.", "badge": "NEW SS26 ARRIVAL", "cta_text": "SHOP NEW RELEASES", "link_url": "/new-arrivals", "image_url": "https://images.unsplash.com/photo-1615440321519-dda3d4b5ccab?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600", "sort_order": 0},
    {"title": "RETRO LOWS & COURT MASTERS", "subtitle": "Timeless terrace vibes, chunkier midsoles, and everyday luxury crafted for maximum comfort.", "badge": "TRENDING NOW", "cta_text": "EXPLORE RETRO KICKS", "link_url": "/collections/retro", "image_url": "https://images.unsplash.com/photo-1670948516733-0220701ea0de?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600", "sort_order": 1},
    {"title": "MAX SPEED CLOUD RUNNERS", "subtitle": "Engineered propulsion foam and hyper-breathable knit. Designed for the track, styled for the street.", "badge": "PERFORMANCE GEAR", "cta_text": "DISCOVER RUNNERS", "link_url": "/collections/runners", "image_url": "https://images.unsplash.com/photo-1597892657493-6847b9640bac?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600", "sort_order": 2},
]

CATEGORIES = [
    {"name": "Retro & High Tops", "slug": "retro", "tagline": "Grail-worthy silhouettes", "image_url": IMG["retro"], "banner_url": IMG["aj1"], "sort_order": 0},
    {"name": "Everyday Streetwear", "slug": "streetwear", "tagline": "Clean low-tops & terrace classics", "image_url": IMG["street"], "banner_url": IMG["dunk"], "sort_order": 1},
    {"name": "Performance Runners", "slug": "runners", "tagline": "Ultra-cushioned responsive foam", "image_url": IMG["grayrun"], "banner_url": IMG["runner"], "sort_order": 2},
    {"name": "Recovery Slides & Foam", "slug": "slides", "tagline": "Post-run cloud softness", "image_url": IMG["slide"], "banner_url": IMG["slideb"], "sort_order": 3},
]

BRANDS = [
    {"name": "AirVault", "slug": "airvault"},
    {"name": "Terrace Co", "slug": "terrace-co"},
    {"name": "CloudStride", "slug": "cloudstride"},
    {"name": "Oasis", "slug": "oasis"},
]

EU_SIZES = ["39", "40", "41", "42", "43", "44", "45", "46"]


def _sizes(stock_map=None):
    out = []
    for s in EU_SIZES:
        stock = 8 if stock_map is None else stock_map.get(s, 5)
        out.append({"size": s, "stock": stock})
    return out


# name, slug, cat, brand, price, compare, primary, hover, flags
_PRODUCTS = [
    ("AJ-4 Retro 'White Oreo' Premium", "aj4-retro-white-oreo", "retro", "airvault", 8999, 14500, "aj4", "aj4b", ["featured", "new", "best"]),
    ("Dunk Low 'Coastline Blue'", "dunk-low-coastline-blue", "streetwear", "terrace-co", 7499, 11999, "dunk", "dunkb", ["featured", "flash", "best"]),
    ("CloudStratus Surge Pro Runner", "cloudstratus-surge-pro", "runners", "cloudstride", 9250, 15000, "runner", "runnerb", ["featured", "new"]),
    ("Oasis Foam Recovery Slides", "oasis-foam-slides", "slides", "oasis", 3899, 5500, "slide", "slideb", ["best", "flash"]),
    ("Court Master Black Panther", "court-master-black-panther", "retro", "airvault", 8250, 12500, "black", "aj1", ["new", "best"]),
    ("Terrace Classic White Low", "terrace-classic-white-low", "streetwear", "terrace-co", 6999, 9999, "whitelow", "adidas", ["featured", "new"]),
    ("EQT Street Support ADV", "eqt-street-support-adv", "streetwear", "terrace-co", 7899, 10999, "eqt", "street", ["flash"]),
    ("Velocity Gray Road Runner", "velocity-gray-road-runner", "runners", "cloudstride", 8499, 13000, "grayrun", "runner", ["new", "best"]),
    ("AJ-1 Retro High 'Ember'", "aj1-retro-high-ember", "retro", "airvault", 10500, 16500, "aj1", "aj4", ["featured", "flash", "best"]),
    ("Boost Knit Cloud Runner", "boost-knit-cloud-runner", "runners", "cloudstride", 9899, 14999, "yeezy", "grayrun", ["new"]),
    ("Studio Athletic Trainer", "studio-athletic-trainer", "streetwear", "terrace-co", 6499, 8999, "athletic", "whitelow", ["best"]),
    ("Adi Mono Panel Low", "adi-mono-panel-low", "streetwear", "terrace-co", 7299, 10500, "adidas", "black", ["new"]),
    ("Oasis Cloud Slide Mono", "oasis-cloud-slide-mono", "slides", "oasis", 3499, 4999, "slideb", "slide", ["flash"]),
    ("AJ-4 Shadow Grail", "aj4-shadow-grail", "retro", "airvault", 11250, 17000, "aj4b", "aj4", ["featured", "best"]),
    ("Dunk High 'Blue Terrace'", "dunk-high-blue-terrace", "retro", "terrace-co", 8799, 12999, "dunkb", "dunk", ["new", "best"]),
    ("CloudStride Marathon Elite", "cloudstride-marathon-elite", "runners", "cloudstride", 10999, 16000, "runnerb", "runner", ["featured", "flash"]),
]


def build_products():
    now = datetime.now(timezone.utc)
    flash_end = (now + timedelta(hours=36)).isoformat()
    products = []
    for i, (name, slug, cat, brand, price, comp, pimg, himg, flags) in enumerate(_PRODUCTS):
        low_stock = {"42": 3, "43": 2} if "best" in flags else None
        products.append({
            "name": name, "slug": slug, "category_slug": cat, "brand_slug": brand,
            "description": f"The {name} blends premium materials with street-ready comfort. Engineered midsole cushioning, breathable uppers, and a durable rubber outsole built for all-day wear across the city. Authentic-grade quality, curated for Pakistan's sneaker culture.",
            "base_price": price, "compare_at_price": comp,
            "images": [IMG[pimg], IMG[himg], IMG.get("street"), IMG.get("black")],
            "hover_image": IMG[himg],
            "sizes": _sizes(low_stock),
            "is_featured": "featured" in flags,
            "is_new_arrival": "new" in flags,
            "is_best_seller": "best" in flags,
            "is_flash_sale": "flash" in flags,
            "flash_sale_ends_at": flash_end if "flash" in flags else None,
            "status": "active",
            "avg_rating": round(4.6 + (i % 5) * 0.08, 1),
            "review_count": 40 + i * 7,
            "sort_order": i,
        })
    return products
