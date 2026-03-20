"""Punto de entrada principal del sistema de planificación urbana"""

import os
import re
import shutil
import argparse
import warnings
import pandas as pd

warnings.filterwarnings("ignore")

from ciudad_15min.data_loader import (
    load_place_boundary, load_walking_graph, load_services, load_residences
)
from ciudad_15min.coverage import evaluate_all_categories
from ciudad_15min.optimization import iterative_reordering
from ciudad_15min.visualization import (
    plot_pareto_front, plot_coverage_comparison,
    create_state_map,
    FOLIUM_OK, MATPLOTLIB_OK,
)


def main():
    parser = argparse.ArgumentParser(
        description="Sistema de Planificación Urbana con Reordenamiento Dinámico"
    )
    parser.add_argument("--place", type=str, required=True,
                       help="Lugar (ej: 'San Juan de Miraflores, Lima, Peru')")
    parser.add_argument("--minutes", type=float, default=15.0,
                       help="Umbral de minutos para accesibilidad")
    parser.add_argument("--speed-kmh", type=float, default=4.5,
                       help="Velocidad peatonal en km/h")
    parser.add_argument("--max-homes", type=int, default=None,
                       help="Número máximo de hogares a considerar (None = todos los encontrados)")
    parser.add_argument("--generations", type=int, default=50,
                       help="Generaciones por optimización NSGA-II")
    parser.add_argument("--population", type=int, default=50,
                       help="Tamaño de población NSGA-II")
    parser.add_argument("--categories", type=str, nargs='+',
                       default=["health", "education", "greens", "work"],
                       help="Categorías a optimizar")
    parser.add_argument("--plot", action="store_true",
                       help="Generar mapa interactivo")
    parser.add_argument("--output-dir", type=str, default=None,
                       help="Directorio de salida (por defecto: outputs/<nombre_distrito>)")
    parser.add_argument("--track-generations", type=int, nargs='+', default=None,
                       help="Generaciones específicas a capturar para tracking (ej: 1 2 3 78 79 80)")

    args = parser.parse_args()

    # Configurar generaciones a rastrear
    track_generations = args.track_generations
    if track_generations is None:
        max_gen = args.generations
        mid_start = max(1, (max_gen // 2) - 4)
        mid_end = min(max_gen, mid_start + 9)
        last_start = max(1, max_gen - 9)
        track_generations = list(range(1, 11)) + list(range(mid_start, mid_end + 1)) + list(range(last_start, max_gen + 1))

    # Generar directorio de salida basado en el nombre del lugar si no se especificó
    if args.output_dir is not None:
        out_dir = os.path.abspath(args.output_dir)
    else:
        # Tomar la primera parte del nombre (antes de la primera coma) y limpiarla
        place_name = args.place.split(",")[0].strip()
        folder_name = re.sub(r'[^\w\s-]', '', place_name).strip().lower().replace(' ', '_')
        out_dir = os.path.abspath(os.path.join("outputs", folder_name))
    # Limpiar directorio de salida para evitar archivos obsoletos
    if os.path.exists(out_dir):
        shutil.rmtree(out_dir)
    maps_dir = os.path.join(out_dir, "maps")
    charts_dir = os.path.join(out_dir, "charts")
    data_dir = os.path.join(out_dir, "data")
    tracking_dir = os.path.join(out_dir, "tracking")
    for d in [maps_dir, charts_dir, data_dir, tracking_dir]:
        os.makedirs(d)

    print("\n" + "="*70)
    print("SISTEMA DE PLANIFICACIÓN URBANA CON REORDENAMIENTO")
    print("="*70)
    print(f"\n[Configuración]")
    print(f"  Lugar: {args.place}")
    print(f"  Umbral: {args.minutes} minutos")
    print(f"  Categorías: {', '.join(args.categories)}")
    print(f"  Directorio de salida: {out_dir}")

    # 1. CARGAR DATOS
    print(f"\n[1/5] Cargando datos geográficos...")
    boundary = load_place_boundary(args.place)

    print(f"[2/5] Cargando red peatonal...")
    G = load_walking_graph(boundary, speed_kmh=args.speed_kmh)
    print(f"  Nodos: {G.number_of_nodes()}, Aristas: {G.number_of_edges()}")

    print(f"[3/5] Cargando servicios...")
    services = load_services(boundary)
    for cat, gdf in services.items():
        print(f"  {cat}: {len(gdf)} puntos")

    print(f"[4/5] Cargando hogares...")
    homes = load_residences(boundary, max_points=args.max_homes)
    if args.max_homes is None:
        print(f"  Hogares: {len(homes)} (todos los encontrados en el mapa)")
    else:
        print(f"  Hogares: {len(homes)} (límite: {args.max_homes})")

    # 2. EVALUACIÓN INICIAL
    print(f"\n[5/5] Evaluando estado inicial...")
    initial_reach, initial_metrics = evaluate_all_categories(
        G, homes, services, args.minutes
    )

    print("\n[ESTADO INICIAL - Métricas de Cobertura]")
    for k, v in initial_metrics.items():
        print(f"  {k}: {v:.3f} ({v*100:.1f}%)")

    # 2.5. GENERAR MAPA DEL ESTADO INICIAL
    if FOLIUM_OK:
        print(f"\n[Generando mapa del estado inicial...]")
        m_before = create_state_map(
            boundary, homes, services,
            reach=initial_reach,
            title="Estado Inicial",
            minutes=args.minutes,
        )
        if m_before is not None:
            before_path = os.path.join(maps_dir, "before.html")
            m_before.save(before_path)
            print(f"  Mapa inicial guardado en: {before_path}")

    # 3. OPTIMIZACIÓN
    final_homes, final_services, history, callback, pareto_df = iterative_reordering(
        G=G,
        initial_homes=homes,
        initial_services=services,
        categories=args.categories,
        minutes=args.minutes,
        max_gen=args.generations,
        pop_size=args.population,
        track_generations=track_generations,
        charts_dir=charts_dir,
        tracking_dir=tracking_dir
    )

    # 4. EVALUACIÓN FINAL
    final_reach, final_metrics = evaluate_all_categories(
        G, final_homes, final_services, args.minutes
    )

    # 5. GUARDAR RESULTADOS
    print(f"\n[Guardando resultados en: {out_dir}]")

    homes_initial = homes.copy()
    homes_initial["covered_all"] = initial_reach["all_categories"].values
    homes_initial["state"] = "initial"
    homes_initial.to_file(os.path.join(data_dir, "homes_initial.geojson"), driver="GeoJSON")

    final_homes_out = final_homes.copy()
    final_homes_out["covered_all"] = final_reach["all_categories"].values
    final_homes_out["state"] = "optimized"
    final_homes_out.to_file(os.path.join(data_dir, "homes_optimized.geojson"), driver="GeoJSON")

    for cat, g in services.items():
        g_out = g.copy()
        g_out["state"] = "initial"
        g_out.to_file(os.path.join(data_dir, f"services_{cat}_initial.geojson"), driver="GeoJSON")

    for cat, g in final_services.items():
        g_out = g.copy()
        g_out["state"] = "optimized"
        g_out.to_file(os.path.join(data_dir, f"services_{cat}_optimized.geojson"), driver="GeoJSON")

    history_df = pd.DataFrame(history)
    history_df.to_csv(os.path.join(data_dir, "optimization_history.csv"), index=False)

    comparison = pd.DataFrame({
        "metric": list(initial_metrics.keys()),
        "initial": list(initial_metrics.values()),
        "final": list(final_metrics.values())
    })
    comparison["improvement"] = comparison["final"] - comparison["initial"]
    comparison["improvement_pct"] = (comparison["improvement"] / comparison["initial"].clip(lower=0.001)) * 100
    comparison.to_csv(os.path.join(data_dir, "comparison_metrics.csv"), index=False)

    print("\n[COMPARATIVA FINAL]")
    print(comparison.to_string(index=False))

    # 6. GRÁFICOS ADICIONALES
    if MATPLOTLIB_OK:
        print(f"\n[Generando gráficos adicionales...]")

        if pareto_df is not None and not pareto_df.empty:
            plot_pareto_front(pareto_df, charts_dir)
        else:
            print("  [ADVERTENCIA] No hay datos del frente de Pareto para graficar")

        plot_coverage_comparison(initial_metrics, final_metrics, charts_dir)

    # 7. GENERAR MAPA DEL ESTADO OPTIMIZADO
    if FOLIUM_OK:
        print(f"\n[Generando mapa del estado optimizado...]")
        m_after = create_state_map(
            boundary, final_homes, final_services,
            reach=final_reach,
            title="Estado Optimizado",
            minutes=args.minutes,
        )
        if m_after is not None:
            after_path = os.path.join(maps_dir, "after.html")
            m_after.save(after_path)
            print(f"  Mapa optimizado guardado en: {after_path}")
    elif args.plot:
        print(f"\n[ADVERTENCIA] folium no está instalado. Instala con: pip install folium")

    print("\n" + "="*70)
    print("PROCESO COMPLETADO EXITOSAMENTE")
    print("="*70)
    print(f"\nTodos los archivos se guardaron en: {out_dir}")


if __name__ == "__main__":
    main()
