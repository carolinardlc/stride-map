"""Evaluación de accesibilidad y cobertura"""

import numpy as np
import pandas as pd
import geopandas as gpd
import networkx as nx
from typing import Dict, Tuple

from ciudad_15min.data_loader import nearest_node_series


def calculate_coverage(
    G: nx.MultiDiGraph,
    homes: gpd.GeoDataFrame,
    services: gpd.GeoDataFrame,
    threshold_min: float = 15.0,
    home_nodes_precomputed: pd.Series = None,
    serv_nodes_precomputed: pd.Series = None,
) -> Tuple[float, np.ndarray]:
    """
    Calcula la cobertura de accesibilidad
    Retorna: (cobertura_porcentaje, array_booleano_de_alcanzabilidad)

    Calcula la distancia desde cada hogar hacia el servicio más cercano
    para evitar inconsistencias donde casas cercanas tienen tiempos muy diferentes.
    """
    if services.empty or homes.empty:
        return 0.0, np.zeros(len(homes), dtype=bool)

    # Usar nodos precalculados si están disponibles (más eficiente y consistente)
    if home_nodes_precomputed is not None and len(home_nodes_precomputed) == len(homes):
        home_nodes = home_nodes_precomputed
    else:
        home_nodes = nearest_node_series(G, homes)

    if serv_nodes_precomputed is not None and len(serv_nodes_precomputed) == len(services):
        serv_nodes = serv_nodes_precomputed
    else:
        serv_nodes = nearest_node_series(G, services)

    uniq_serv_nodes = list(set(serv_nodes.dropna().tolist()))

    if not uniq_serv_nodes:
        return 0.0, np.zeros(len(homes), dtype=bool)

    reachable = np.zeros(len(homes), dtype=bool)

    # Calcular distancias desde todos los servicios hacia todos los nodos alcanzables
    try:
        lengths_from_services = nx.multi_source_dijkstra_path_length(G, uniq_serv_nodes, weight="travel_time")
    except Exception as e:
        print(f"[ADVERTENCIA] Error en multi_source_dijkstra: {e}")
        lengths_from_services = {}
        for serv_node in uniq_serv_nodes:
            try:
                lengths = nx.single_source_dijkstra_path_length(G, serv_node, weight="travel_time")
                for node, dist in lengths.items():
                    if node not in lengths_from_services or dist < lengths_from_services[node]:
                        lengths_from_services[node] = dist
            except Exception:
                continue

    # Agrupar hogares por nodo para evitar cálculos duplicados
    unique_home_nodes = {}
    for i, (idx, hn) in enumerate(home_nodes.items()):
        if hn not in unique_home_nodes:
            unique_home_nodes[hn] = []
        unique_home_nodes[hn].append(i)

    # Calcular tiempo para cada nodo único de hogar
    for hn, indices in unique_home_nodes.items():
        if hn in lengths_from_services:
            t_seconds = lengths_from_services[hn]
            t_minutes = t_seconds / 60.0
        else:
            # Nodo no alcanzable por Dijkstra multi-source: marcarlo como no cubierto
            t_minutes = np.inf

        for idx in indices:
            reachable[idx] = t_minutes <= threshold_min

    coverage = float(np.mean(reachable))
    return coverage, reachable


def evaluate_all_categories(
    G: nx.MultiDiGraph,
    homes: gpd.GeoDataFrame,
    services_by_cat: Dict[str, gpd.GeoDataFrame],
    minutes: float,
) -> Tuple[pd.DataFrame, Dict[str, float]]:
    """Evalúa cobertura para todas las categorías"""
    metrics = {}
    reach_arrays = {}

    for cat, pois in services_by_cat.items():
        cov, reach = calculate_coverage(G, homes, pois, minutes)
        reach_arrays[cat] = reach
        metrics[f"cov_{cat}"] = cov

    # Cobertura integral: hogares que alcanzan TODAS las categorías
    reach_df = pd.DataFrame(reach_arrays, index=homes.index)
    reach_df.columns = [f"reach_{c}" for c in services_by_cat.keys()]
    reach_df["all_categories"] = reach_df.all(axis=1)
    metrics["cov_all"] = reach_df["all_categories"].mean()

    return reach_df, metrics
