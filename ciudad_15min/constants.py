"""Constantes y configuración de servicios OSM"""

OSM_QUERIES = {
    "health": [{"amenity": ["hospital", "clinic", "doctors", "dentist", "pharmacy"]}],
    "education": [{"amenity": ["school", "college", "university", "kindergarten"]}],
    "greens": [{"leisure": ["park", "garden", "playground"]}, {"landuse": ["recreation_ground"]}],
    "work": [
        {"amenity": ["office", "coworking"]},
        {"landuse": ["commercial", "industrial"]},
        {"shop": True},
    ],
}

RESIDENTIAL_BUILDING_TAGS = {"building": ["residential", "apartments", "house", "detached", "terrace"]}

CATEGORY_MAP = {"home": 0, "health": 1, "education": 2, "greens": 3, "work": 4}
CATEGORY_MAP_REVERSE = {v: k for k, v in CATEGORY_MAP.items()}
SERVICE_CATEGORIES = ["health", "education", "greens", "work"]
ALL_CATEGORY_IDS = list(CATEGORY_MAP.values())
