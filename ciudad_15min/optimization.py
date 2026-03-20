"""Problema de optimización NSGA-II y funciones de ejecución"""

import os
import json
import numpy as np
import pandas as pd
import geopandas as gpd
import networkx as nx
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional

from pymoo.algorithms.moo.nsga2 import NSGA2
from pymoo.core.problem import ElementwiseProblem
from pymoo.termination import get_termination
from pymoo.optimize import minimize
from pymoo.core.callback import Callback

from ciudad_15min.constants import CATEGORY_MAP, SERVICE_CATEGORIES, ALL_CATEGORY_IDS
from ciudad_15min.data_loader import nearest_node_series
from ciudad_15min.coverage import calculate_coverage, evaluate_all_categories
from ciudad_15min.ga_operators import (
    FeasibleSamplingAllCategories,
    FeasibleRepairAllCategories,
    FeasibleCrossoverAllCategories,
    FeasibleMutationAllCategories,
)


class ReorderingProblemAllCategories(ElementwiseProblem):
    """
    Problema de optimización que optimiza TODAS las categorías simultáneamente.

    Variables categóricas: 0=hogar, 1=health, 2=education, 3=greens, 4=work
    """

    def __init__(self,
                 G: nx.MultiDiGraph,
                 initial_homes: gpd.GeoDataFrame,
                 initial_services: Dict[str, gpd.GeoDataFrame],
                 minutes: float = 15.0):
        self.G = G
        self.initial_homes = initial_homes.copy()
        self.initial_services = {k: v.copy() for k, v in initial_services.items()}
        self.minutes = minutes

        # Números objetivo iniciales de cada tipo
        initial_counts = {
            "home": len(initial_homes),
        }
        for cat in SERVICE_CATEGORIES:
            initial_counts[cat] = len(initial_services.get(cat, gpd.GeoDataFrame()))

        # Crear pool de ubicaciones con tipo inicial marcado
        initial_homes_marked = initial_homes.copy()
        initial_homes_marked['initial_type'] = CATEGORY_MAP["home"]

        all_locations = [initial_homes_marked]
        for cat, cat_services in initial_services.items():
            if not cat_services.empty:
                cat_marked = cat_services.copy()
                cat_marked['initial_type'] = CATEGORY_MAP[cat]
                all_locations.append(cat_marked)

        self.location_pool = pd.concat(all_locations, ignore_index=True)

        # Para duplicados, conservar el primer tipo encontrado (preferencia: hogares primero)
        self.location_pool = self.location_pool.sort_values('initial_type').drop_duplicates(subset=['geometry'], keep='first').reset_index(drop=True)

        self.initial_config = self.location_pool['initial_type'].values
        self.location_pool = self.location_pool[['geometry']].reset_index(drop=True)

        n_locations = len(self.location_pool)

        # Ajustar números objetivo proporcionalmente si hay duplicados eliminados
        total_initial = sum(initial_counts.values())

        if total_initial > n_locations:
            ratio = n_locations / total_initial
            self.n_homes = max(1, int(initial_counts["home"] * ratio))
            self.n_health = max(0, int(initial_counts["health"] * ratio))
            self.n_education = max(0, int(initial_counts["education"] * ratio))
            self.n_greens = max(0, int(initial_counts["greens"] * ratio))
            self.n_work = max(0, int(initial_counts["work"] * ratio))

            current_sum = self.n_homes + self.n_health + self.n_education + self.n_greens + self.n_work
            diff = n_locations - current_sum

            if diff != 0:
                self.n_homes += diff
                if self.n_homes < 1:
                    self.n_homes = 1
                    remaining = n_locations - self.n_homes - self.n_health - self.n_education - self.n_greens - self.n_work
                    if remaining > 0:
                        self.n_health += remaining
                    elif remaining < 0:
                        self.n_health = max(0, self.n_health + remaining)
        else:
            self.n_homes = initial_counts["home"]
            self.n_health = initial_counts["health"]
            self.n_education = initial_counts["education"]
            self.n_greens = initial_counts["greens"]
            self.n_work = initial_counts["work"]

        super().__init__(
            n_var=n_locations,
            n_obj=5,
            n_constr=5,
            xl=0,
            xu=4,
            type_var=np.int64
        )

        self.location_nodes = nearest_node_series(G, self.location_pool)

        print(f"[Problema Inicializado - Todas las Categorías]")
        print(f"  - Ubicaciones totales: {n_locations}")
        print(f"  - Total inicial (antes de eliminar duplicados): {total_initial}")
        if total_initial > n_locations:
            print(f"  - Duplicados eliminados: {total_initial - n_locations}")
        print(f"  - Hogares: {self.n_homes}")
        print(f"  - Health: {self.n_health}")
        print(f"  - Education: {self.n_education}")
        print(f"  - Greens: {self.n_greens}")
        print(f"  - Work: {self.n_work}")
        print(f"  - Total asignado: {self.n_homes + self.n_health + self.n_education + self.n_greens + self.n_work}")

    def _evaluate(self, x, out, *args, **kwargs):
        homes_locs = self.location_pool[x == CATEGORY_MAP["home"]].copy()
        home_mask_indices = np.where(x == CATEGORY_MAP["home"])[0]

        objectives = []

        # Calcular cobertura para cada categoría de servicio
        for cat_name in SERVICE_CATEGORIES:
            cat_id = CATEGORY_MAP[cat_name]
            cat_locs = self.location_pool[x == cat_id].copy()
            cat_mask_indices = np.where(x == cat_id)[0]

            if not cat_locs.empty and not homes_locs.empty:
                home_nodes_subset = self.location_nodes.iloc[home_mask_indices] if len(home_mask_indices) > 0 else None
                serv_nodes_subset = self.location_nodes.iloc[cat_mask_indices] if len(cat_mask_indices) > 0 else None
                cov, _ = calculate_coverage(
                    self.G, homes_locs, cat_locs, self.minutes,
                    home_nodes_precomputed=home_nodes_subset,
                    serv_nodes_precomputed=serv_nodes_subset
                )
                objectives.append(1.0 - cov)
            else:
                objectives.append(1.0)

        # f5: Minimizar cambios respecto a configuración inicial
        n_changes = int((x != self.initial_config).sum())
        change_ratio = n_changes / len(x) if len(x) > 0 else 1.0
        objectives.append(change_ratio * 5.0)

        # Restricciones: número objetivo de cada tipo
        targets = {
            CATEGORY_MAP["home"]: self.n_homes,
            CATEGORY_MAP["health"]: self.n_health,
            CATEGORY_MAP["education"]: self.n_education,
            CATEGORY_MAP["greens"]: self.n_greens,
            CATEGORY_MAP["work"]: self.n_work,
        }
        margin = max(1, int(min(targets.values()) * 0.01))

        constraints = []
        for cat_id in ALL_CATEGORY_IDS:
            actual = int((x == cat_id).sum())
            constraints.append(max(0, abs(actual - targets[cat_id]) - margin))

        out["F"] = objectives
        out["G"] = constraints


@dataclass
class ExchangeTracker:
    """Clase para rastrear intercambios en individuos"""
    generation: int
    individual_index: int
    n_exchanges: int
    objectives: List[float] = field(default_factory=list)
    solution: Optional[np.ndarray] = None


class EvolutionCallback(Callback):
    """Callback personalizado para NSGA-II que rastrea intercambios por generación."""

    def __init__(self, initial_config: np.ndarray, track_generations: List[int] = None):
        super().__init__()
        self.initial_config = initial_config.copy()
        self.track_generations = track_generations if track_generations else list(range(1, 11)) + list(range(95, 105)) + list(range(191, 201))

        self.generation_data: Dict[int, Dict] = {}
        self.exchange_tracking: List[ExchangeTracker] = []
        self.evolution_history: List[Dict] = []

    def notify(self, algorithm):
        try:
            generation = algorithm.n_gen

            pop = algorithm.pop
            if pop is None:
                return

            X = None
            F = None

            if hasattr(pop, 'get'):
                X = pop.get("X")
                F = pop.get("F")
            elif hasattr(pop, 'X') and hasattr(pop, 'F'):
                X = pop.X
                F = pop.F
            elif hasattr(pop, '__getitem__'):
                try:
                    X = pop["X"]
                    F = pop["F"]
                except:
                    pass

            if X is None or F is None or len(X) == 0:
                return
        except Exception:
            return

        exchanges_per_individual = []
        for i, x in enumerate(X):
            n_exchanges = int((x != self.initial_config).sum())
            exchanges_per_individual.append(n_exchanges)

            if generation in self.track_generations:
                tracker = ExchangeTracker(
                    generation=generation,
                    individual_index=i,
                    n_exchanges=n_exchanges,
                    objectives=F[i].tolist() if len(F) > i else [],
                    solution=x.copy()
                )
                self.exchange_tracking.append(tracker)

        stats = {
            "generation": generation,
            "mean_exchanges": float(np.mean(exchanges_per_individual)),
            "std_exchanges": float(np.std(exchanges_per_individual)),
            "min_exchanges": int(np.min(exchanges_per_individual)),
            "max_exchanges": int(np.max(exchanges_per_individual)),
            "median_exchanges": float(np.median(exchanges_per_individual)),
            "n_individuals": len(X),
            "best_objective": float(np.min(F[:, 0])) if len(F) > 0 and F.shape[1] > 0 else 0.0,
            "mean_objective": float(np.mean(F[:, 0])) if len(F) > 0 and F.shape[1] > 0 else 0.0
        }

        self.generation_data[generation] = stats
        self.evolution_history.append(stats)

    def get_exchange_stats(self) -> pd.DataFrame:
        if not self.evolution_history:
            return pd.DataFrame()
        return pd.DataFrame(self.evolution_history)

    def get_tracked_exchanges(self) -> pd.DataFrame:
        if not self.exchange_tracking:
            return pd.DataFrame()

        data = []
        for tracker in self.exchange_tracking:
            data.append({
                "generation": tracker.generation,
                "individual_index": tracker.individual_index,
                "n_exchanges": tracker.n_exchanges,
                "objectives": tracker.objectives,
            })

        return pd.DataFrame(data)

    def export_detailed_stats(self, output_dir: str):
        os.makedirs(output_dir, exist_ok=True)

        stats_df = self.get_exchange_stats()
        if not stats_df.empty:
            stats_df.to_csv(
                os.path.join(output_dir, "exchange_stats_by_generation.csv"),
                index=False
            )

        tracked_df = self.get_tracked_exchanges()
        if not tracked_df.empty:
            tracked_df.to_csv(
                os.path.join(output_dir, "tracked_exchanges_specific_generations.csv"),
                index=False
            )

        summary = {
            "total_generations_tracked": len(self.generation_data),
            "tracked_generations": sorted(self.track_generations),
            "total_individuals_captured": len(self.exchange_tracking),
            "statistics_by_generation": {
                str(gen): stats for gen, stats in self.generation_data.items()
            }
        }

        with open(os.path.join(output_dir, "evolution_summary.json"), 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)


def calculate_exchanges(initial_config: np.ndarray, solution: np.ndarray) -> int:
    """Calcula el número de intercambios entre configuración inicial y solución"""
    return int((solution != initial_config).sum())


def run_reordering_optimization_all_categories(
    G: nx.MultiDiGraph,
    homes: gpd.GeoDataFrame,
    services: Dict[str, gpd.GeoDataFrame],
    minutes: float = 15.0,
    max_gen: int = 200,
    pop_size: int = 50,
    callback: Optional[EvolutionCallback] = None,
    track_generations: List[int] = None
) -> Tuple[gpd.GeoDataFrame, Dict[str, gpd.GeoDataFrame], pd.DataFrame, Dict[str, float], Optional[EvolutionCallback]]:
    """Ejecuta optimización con reordenamiento para TODAS las categorías simultáneamente"""
    print(f"\n[NSGA-II] Iniciando optimización con reordenamiento para TODAS las categorías")
    print(f"  Generaciones: {max_gen}, Población: {pop_size}")

    problem = ReorderingProblemAllCategories(G, homes, services, minutes)

    if callback is None:
        initial_config = problem.initial_config
        callback = EvolutionCallback(initial_config, track_generations=track_generations)
        print(f"  [Tracking] Callback creado para rastrear intercambios")
        if track_generations:
            print(f"  [Tracking] Generaciones específicas a capturar: {track_generations}")

    sampling = FeasibleSamplingAllCategories(
        n_homes=problem.n_homes,
        n_health=problem.n_health,
        n_education=problem.n_education,
        n_greens=problem.n_greens,
        n_work=problem.n_work,
        initial_change_percentage=0.02
    )
    crossover = FeasibleCrossoverAllCategories(
        n_homes=problem.n_homes,
        n_health=problem.n_health,
        n_education=problem.n_education,
        n_greens=problem.n_greens,
        n_work=problem.n_work,
        prob=0.9
    )
    mutation = FeasibleMutationAllCategories(
        n_homes=problem.n_homes,
        n_health=problem.n_health,
        n_education=problem.n_education,
        n_greens=problem.n_greens,
        n_work=problem.n_work,
        prob=0.7
    )
    repair = FeasibleRepairAllCategories(
        n_homes=problem.n_homes,
        n_health=problem.n_health,
        n_education=problem.n_education,
        n_greens=problem.n_greens,
        n_work=problem.n_work
    )
    algorithm = NSGA2(
        pop_size=pop_size,
        sampling=sampling,
        crossover=crossover,
        mutation=mutation,
        repair=repair,
        eliminate_duplicates=True
    )
    termination = get_termination("n_gen", max_gen)

    if callback is not None:
        res = minimize(problem, algorithm, termination, verbose=True, seed=42, callback=callback)
    else:
        res = minimize(problem, algorithm, termination, verbose=True, seed=42)

    F = res.F
    X = res.X

    if X is None or F is None or len(X) == 0:
        print("[ERROR] La optimización no produjo resultados válidos")
        new_homes = homes.copy()
        new_services = {k: v.copy() for k, v in services.items()}
        pareto = pd.DataFrame()
        best_covs = {cat: 0.0 for cat in services.keys()}
        return new_homes, new_services, pareto, best_covs, callback

    # Filtrar soluciones factibles
    margin = max(1, int(min(problem.n_homes, problem.n_health, problem.n_education, problem.n_greens, problem.n_work) * 0.01))
    targets = {
        CATEGORY_MAP["home"]: problem.n_homes,
        CATEGORY_MAP["health"]: problem.n_health,
        CATEGORY_MAP["education"]: problem.n_education,
        CATEGORY_MAP["greens"]: problem.n_greens,
        CATEGORY_MAP["work"]: problem.n_work,
    }

    feasible_mask = []
    for x in X:
        feasible = all(
            abs(int((x == cat_id).sum()) - targets[cat_id]) <= margin
            for cat_id in ALL_CATEGORY_IDS
        )
        feasible_mask.append(feasible)
    feasible_mask = np.array(feasible_mask)

    if not np.any(feasible_mask):
        print(f"[ADVERTENCIA] No se encontraron soluciones factibles (margen: +/-{margin})")
        print(f"  Usando todas las soluciones disponibles")
        feasible_mask = np.ones(len(X), dtype=bool)
    else:
        print(f"[INFO] {feasible_mask.sum()}/{len(X)} soluciones factibles encontradas")

    F_feas = F[feasible_mask]
    X_feas = X[feasible_mask]

    change_ratio_raw = F_feas[:, 4] / 5.0

    pareto = pd.DataFrame({
        "1-cov_health": F_feas[:, 0],
        "1-cov_education": F_feas[:, 1],
        "1-cov_greens": F_feas[:, 2],
        "1-cov_work": F_feas[:, 3],
        "change_ratio": change_ratio_raw
    })
    pareto["solution_index"] = np.arange(len(pareto))

    norm = (pareto.iloc[:, :4] - pareto.iloc[:, :4].min()) / (pareto.iloc[:, :4].max() - pareto.iloc[:, :4].min() + 1e-9)
    norm_changes = pareto["change_ratio"] / (pareto["change_ratio"].max() + 1e-9)
    pareto["score"] = norm.sum(axis=1) + 5.0 * norm_changes

    best_idx = int(pareto.sort_values("score").iloc[0]["solution_index"])
    x_best = X_feas[best_idx]

    # Reconstruir configuración óptima
    new_homes = problem.location_pool[x_best == CATEGORY_MAP["home"]].copy()
    new_homes["category"] = "home"
    new_homes["type"] = "home"
    new_homes["iteration"] = "optimized"

    new_services = {}
    for cat_name in SERVICE_CATEGORIES:
        cat_id = CATEGORY_MAP[cat_name]
        new_services[cat_name] = problem.location_pool[x_best == cat_id].copy()
        new_services[cat_name]["category"] = cat_name
        new_services[cat_name]["type"] = "service"
        new_services[cat_name]["iteration"] = "optimized"

    best_covs = {}
    for i, cat_name in enumerate(SERVICE_CATEGORIES):
        best_covs[cat_name] = 1.0 - float(F_feas[best_idx, i])

    n_changes = int((x_best != problem.initial_config).sum())
    total_locations = len(x_best)
    change_percentage = (n_changes / total_locations * 100) if total_locations > 0 else 0.0

    print(f"\n[Resultado] Mejores coberturas:")
    for cat, cov in best_covs.items():
        print(f"  {cat}: {cov:.3f}")
    print(f"  Hogares: {len(new_homes)} (objetivo: {problem.n_homes})")
    print(f"  Cambios realizados: {n_changes}/{total_locations} ({change_percentage:.1f}%)")

    if callback and callback.evolution_history:
        stats_df = callback.get_exchange_stats()
        if not stats_df.empty:
            print(f"\n[Tracking] Estadísticas de intercambios:")
            print(f"  Generaciones rastreadas: {len(callback.generation_data)}")
            print(f"  Intercambios promedio (inicial): {stats_df.iloc[0]['mean_exchanges']:.1f}")
            print(f"  Intercambios promedio (final): {stats_df.iloc[-1]['mean_exchanges']:.1f}")
            if len(stats_df) > 1:
                improvement = stats_df.iloc[-1]['mean_exchanges'] - stats_df.iloc[0]['mean_exchanges']
                print(f"  Evolución de intercambios: {improvement:+.1f}")

    return new_homes, new_services, pareto, best_covs, callback


def iterative_reordering(
    G: nx.MultiDiGraph,
    initial_homes: gpd.GeoDataFrame,
    initial_services: Dict[str, gpd.GeoDataFrame],
    categories: List[str],
    minutes: float = 15.0,
    max_gen: int = 200,
    pop_size: int = 50,
    track_generations: List[int] = None,
    charts_dir: str = None,
    tracking_dir: str = None,
) -> Tuple[gpd.GeoDataFrame, Dict[str, gpd.GeoDataFrame], List[Dict], Optional[EvolutionCallback], pd.DataFrame]:
    """Ejecuta optimización de TODAS las categorías simultáneamente"""
    from ciudad_15min.visualization import plot_exchange_evolution, plot_distribution_by_periods

    if track_generations is None:
        track_generations = [1, 2, 3, max_gen-2, max_gen-1, max_gen]

    print("\n" + "="*70)
    print("OPTIMIZACIÓN CON REORDENAMIENTO - TODAS LAS CATEGORÍAS JUNTAS")
    print("="*70)
    print(f"\n[Tracking] Generaciones específicas a capturar: {track_generations}")

    history = []

    _, initial_metrics = evaluate_all_categories(G, initial_homes, initial_services, minutes)
    history.append({
        "iteration": 0,
        "category": "initial",
        **initial_metrics
    })

    print(f"\n[Estado Inicial]")
    for k, v in initial_metrics.items():
        print(f"  {k}: {v:.3f}")

    print(f"\n{'='*70}")
    print(f"OPTIMIZANDO TODAS LAS CATEGORÍAS SIMULTÁNEAMENTE")
    print(f"{'='*70}")

    final_homes, final_services, pareto_df, best_covs, callback = run_reordering_optimization_all_categories(
        G=G,
        homes=initial_homes,
        services=initial_services,
        minutes=minutes,
        max_gen=max_gen,
        pop_size=pop_size,
        track_generations=track_generations
    )

    _, final_metrics = evaluate_all_categories(G, final_homes, final_services, minutes)

    history.append({
        "iteration": 1,
        "category": "all_categories",
        **final_metrics
    })

    print(f"\n[Métricas después de optimización]")
    for k, v in final_metrics.items():
        print(f"  {k}: {v:.3f}")

    print("\n" + "="*70)
    print("OPTIMIZACIÓN COMPLETADA")
    print("="*70)

    initial_cov_all = initial_metrics["cov_all"]
    final_cov_all = final_metrics["cov_all"]
    improvement = ((final_cov_all - initial_cov_all) / max(initial_cov_all, 0.001)) * 100

    print(f"\n[RESUMEN]")
    print(f"  Cobertura inicial (todas las categorías): {initial_cov_all:.3f}")
    print(f"  Cobertura final (todas las categorías): {final_cov_all:.3f}")
    print(f"  Mejora: {improvement:+.1f}%")
    print(f"  Hogares mantenidos: {len(final_homes)} (inicial: {len(initial_homes)})")

    if callback and (charts_dir or tracking_dir):
        print(f"\n[Exportando estadísticas y gráficos evolutivos...]")
        if tracking_dir:
            callback.export_detailed_stats(tracking_dir)
        if charts_dir:
            plot_exchange_evolution(callback, charts_dir)
            plot_distribution_by_periods(callback, charts_dir, max_gen=max_gen)
        print(f"  Estadísticas y gráficos exportados")

    return final_homes, final_services, history, callback, pareto_df
