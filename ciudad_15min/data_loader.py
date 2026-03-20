"""Carga de datos geográficos desde OpenStreetMap"""

import os
import numpy as np
import pandas as pd
import geopandas as gpd
import osmnx as ox
import networkx as nx
from shapely.geometry import Point
from typing import Dict, List

from ciudad_15min.constants import OSM_QUERIES, RESIDENTIAL_BUILDING_TAGS

# Configuración de OSMnx: cache y timeout
ox.settings.use_cache = True
ox.settings.cache_folder = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cache"
)
ox.settings.requests_timeout = 180


def load_place_boundary(place: str) -> gpd.GeoDataFrame:
    """Carga el límite del área geográfica"""
    gdf = ox.geocode_to_gdf(place)
    if gdf.empty:
        raise ValueError(f"No se pudo geocodificar el lugar: {place}")
    return gdf.to_crs(4326)


def load_walking_graph(boundary: gpd.GeoDataFrame, speed_kmh: float = 4.5) -> nx.MultiDiGraph:
    """Carga la red peatonal del área"""
    poly = boundary.geometry.iloc[0]
    G = ox.graph_from_polygon(poly, network_type="walk", simplify=True)
    G = ox.distance.add_edge_lengths(G)
    speed_mps = (speed_kmh * 1000) / 3600
    for u, v, k, data in G.edges(keys=True, data=True):
        length = data.get("length", 0.0) or 0.0
        data["travel_time"] = length / max(speed_mps, 0.1)
    return G


def _download_pois(boundary: gpd.GeoDataFrame, osm_filters: List[dict]) -> gpd.GeoDataFrame:
    """Descarga puntos de interés desde OpenStreetMap"""
    poly = boundary.geometry.iloc[0]
    gdfs = []
    for f in osm_filters:
        try:
            g = ox.geometries_from_polygon(poly, f)
            if not g.empty:
                gdfs.append(g)
        except Exception:
            continue
    if not gdfs:
        return gpd.GeoDataFrame(geometry=[], crs=4326)
    g = pd.concat(gdfs, axis=0)
    g = g.reset_index(drop=True)
    g = g[g.geometry.notna()].to_crs(4326)
    g["geometry"] = g.geometry.centroid
    return g[["geometry"]].dropna().drop_duplicates()


def load_services(boundary: gpd.GeoDataFrame) -> Dict[str, gpd.GeoDataFrame]:
    """Carga todos los servicios por categoría"""
    services = {}
    for cat, filters in OSM_QUERIES.items():
        g = _download_pois(boundary, filters)
        g["category"] = cat
        g["type"] = "service"
        services[cat] = g
    return services


def load_residences(boundary: gpd.GeoDataFrame, max_points: int = None) -> gpd.GeoDataFrame:
    """Carga ubicaciones de hogares

    Args:
        boundary: Límite del área geográfica
        max_points: Número máximo de hogares a cargar. Si es None, carga todos los encontrados.
    """
    poly = boundary.geometry.iloc[0]
    try:
        b = ox.geometries_from_polygon(poly, RESIDENTIAL_BUILDING_TAGS)
        b = b[b.geometry.notna()].to_crs(4326)
        b["geometry"] = b.geometry.centroid
        homes = b[["geometry"]].dropna().drop_duplicates()
    except Exception:
        homes = gpd.GeoDataFrame(geometry=[], crs=4326)

    if homes.empty:
        # Fallback: muestrear puntos dentro del polígono
        bounds = poly.envelope
        minx, miny, maxx, maxy = bounds.bounds
        pts = []
        rng = np.random.default_rng(42)
        fallback_limit = max_points if max_points is not None else 3000
        for _ in range(30000):
            x = rng.uniform(minx, maxx)
            y = rng.uniform(miny, maxy)
            p = Point(x, y)
            if poly.contains(p):
                pts.append(p)
            if max_points is not None and len(pts) >= max_points:
                break
        homes = gpd.GeoDataFrame(geometry=pts, crs=4326)

    # Solo limitar si se especificó max_points
    if max_points is not None and len(homes) > max_points:
        homes = homes.sample(max_points, random_state=42).reset_index(drop=True)

    homes["category"] = "home"
    homes["type"] = "home"
    return homes


def nearest_node_series(G: nx.MultiDiGraph, gdf: gpd.GeoDataFrame) -> pd.Series:
    """Encuentra el nodo más cercano en la red para cada punto"""
    xs = gdf.geometry.x.to_numpy()
    ys = gdf.geometry.y.to_numpy()
    nn = ox.distance.nearest_nodes(G, xs, ys)
    return pd.Series(nn, index=gdf.index)
