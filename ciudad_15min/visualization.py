"""Visualización: gráficos matplotlib y mapas folium"""
from __future__ import annotations

import os
import numpy as np
import pandas as pd
import geopandas as gpd
import networkx as nx
from typing import Dict, List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from ciudad_15min.optimization import EvolutionCallback

try:
    import matplotlib.pyplot as plt
    import matplotlib
    matplotlib.use('Agg')
    MATPLOTLIB_OK = True
except Exception:
    MATPLOTLIB_OK = False

try:
    import folium
    from folium import plugins
    FOLIUM_OK = True
except Exception:
    FOLIUM_OK = False


def plot_exchange_evolution(callback: EvolutionCallback, output_dir: str):
    """Genera gráficos de evolución de intercambios"""
    if not MATPLOTLIB_OK:
        print("[ADVERTENCIA] matplotlib no instalado: omitiendo gráficos")
        return

    if not callback.evolution_history:
        print("[ADVERTENCIA] No hay datos de evolución para graficar")
        return

    os.makedirs(output_dir, exist_ok=True)
    stats_df = callback.get_exchange_stats()

    if stats_df.empty:
        return

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('Análisis Evolutivo de Intercambios', fontsize=16, fontweight='bold')

    # Gráfico 1: Evolución de intercambios promedio
    ax1 = axes[0, 0]
    ax1.plot(stats_df['generation'], stats_df['mean_exchanges'],
             label='Promedio', linewidth=2, color='blue')
    ax1.fill_between(stats_df['generation'],
                     stats_df['mean_exchanges'] - stats_df['std_exchanges'],
                     stats_df['mean_exchanges'] + stats_df['std_exchanges'],
                     alpha=0.3, color='blue', label='±1 Desviación Estándar')
    ax1.plot(stats_df['generation'], stats_df['min_exchanges'],
             '--', label='Mínimo', linewidth=1, color='green', alpha=0.7)
    ax1.plot(stats_df['generation'], stats_df['max_exchanges'],
             '--', label='Máximo', linewidth=1, color='red', alpha=0.7)
    ax1.set_xlabel('Generación', fontsize=11)
    ax1.set_ylabel('Número de Intercambios', fontsize=11)
    ax1.set_title('Evolución de Intercambios por Generación', fontsize=12, fontweight='bold')
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    # Gráfico 2: Distribución de intercambios (boxplot)
    ax2 = axes[0, 1]
    tracked_df = callback.get_tracked_exchanges()
    if not tracked_df.empty:
        tracked_generations = sorted(tracked_df['generation'].unique())
        box_data = [tracked_df[tracked_df['generation'] == gen]['n_exchanges'].values
                   for gen in tracked_generations]
        bp = ax2.boxplot(box_data, labels=[f'Gen {g}' for g in tracked_generations],
                        patch_artist=True)
        for patch in bp['boxes']:
            patch.set_facecolor('lightblue')
        ax2.set_xlabel('Generación', fontsize=11)
        ax2.set_ylabel('Número de Intercambios', fontsize=11)
        ax2.set_title('Distribución de Intercambios en Generaciones Específicas',
                     fontsize=12, fontweight='bold')
        ax2.grid(True, alpha=0.3, axis='y')
    else:
        ax2.text(0.5, 0.5, 'No hay datos para mostrar',
                ha='center', va='center', transform=ax2.transAxes)
        ax2.set_title('Distribución de Intercambios', fontsize=12)

    # Gráfico 3: Convergencia del algoritmo
    ax3 = axes[1, 0]
    if 'best_objective' in stats_df.columns and 'mean_objective' in stats_df.columns:
        ax3.plot(stats_df['generation'], stats_df['best_objective'],
                label='Mejor Objetivo', linewidth=2, color='green')
        ax3.plot(stats_df['generation'], stats_df['mean_objective'],
                label='Objetivo Promedio', linewidth=2, color='orange')
        ax3.set_xlabel('Generación', fontsize=11)
        ax3.set_ylabel('Valor del Objetivo', fontsize=11)
        ax3.set_title('Convergencia del Algoritmo', fontsize=12, fontweight='bold')
        ax3.legend()
        ax3.grid(True, alpha=0.3)
    else:
        ax3.text(0.5, 0.5, 'Datos de objetivos no disponibles',
                ha='center', va='center', transform=ax3.transAxes)
        ax3.set_title('Convergencia del Algoritmo', fontsize=12)

    # Gráfico 4: Histograma de intercambios
    ax4 = axes[1, 1]
    if not tracked_df.empty:
        all_exchanges = tracked_df['n_exchanges'].values
        ax4.hist(all_exchanges, bins=20, edgecolor='black', alpha=0.7, color='steelblue')
        ax4.axvline(np.mean(all_exchanges), color='red', linestyle='--',
                   linewidth=2, label=f'Promedio: {np.mean(all_exchanges):.1f}')
        ax4.axvline(np.median(all_exchanges), color='green', linestyle='--',
                   linewidth=2, label=f'Mediana: {np.median(all_exchanges):.1f}')
        ax4.set_xlabel('Número de Intercambios', fontsize=11)
        ax4.set_ylabel('Frecuencia', fontsize=11)
        ax4.set_title('Distribución de Intercambios (Todas las Generaciones Capturadas)',
                     fontsize=12, fontweight='bold')
        ax4.legend()
        ax4.grid(True, alpha=0.3, axis='y')
    else:
        ax4.text(0.5, 0.5, 'No hay datos para mostrar',
                ha='center', va='center', transform=ax4.transAxes)
        ax4.set_title('Distribución de Intercambios', fontsize=12)

    plt.tight_layout()
    output_path = os.path.join(output_dir, "evolution_analysis.png")
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()

    print(f"  Gráfico de evolución guardado en: {output_path}")

    # Gráfico adicional: Comparación entre generaciones específicas
    if not tracked_df.empty:
        fig2, ax = plt.subplots(figsize=(12, 6))
        tracked_generations = sorted(tracked_df['generation'].unique())

        positions = np.arange(len(tracked_generations))
        means = [tracked_df[tracked_df['generation'] == gen]['n_exchanges'].mean()
                for gen in tracked_generations]
        stds = [tracked_df[tracked_df['generation'] == gen]['n_exchanges'].std()
               for gen in tracked_generations]

        bars = ax.bar(positions, means, yerr=stds, capsize=5, alpha=0.7,
                     color='steelblue', edgecolor='black', linewidth=1.5)

        ax.set_xlabel('Generación', fontsize=12, fontweight='bold')
        ax.set_ylabel('Intercambios Promedio', fontsize=12, fontweight='bold')
        ax.set_title('Comparación de Intercambios en Generaciones Específicas',
                    fontsize=14, fontweight='bold')
        ax.set_xticks(positions)
        ax.set_xticklabels([f'Gen {g}' for g in tracked_generations])
        ax.grid(True, alpha=0.3, axis='y')

        for i, (bar, mean) in enumerate(zip(bars, means)):
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height + stds[i] + 0.5,
                   f'{mean:.1f}', ha='center', va='bottom', fontweight='bold')

        plt.tight_layout()
        output_path2 = os.path.join(output_dir, "exchange_comparison_generations.png")
        plt.savefig(output_path2, dpi=300, bbox_inches='tight')
        plt.close()

        print(f"  Gráfico de comparación guardado en: {output_path2}")


def plot_distribution_by_periods(callback: EvolutionCallback, output_dir: str, max_gen: int = 200):
    """Genera 3 gráficos de distribución de intercambios por períodos"""
    if not MATPLOTLIB_OK:
        print("[ADVERTENCIA] matplotlib no instalado: omitiendo gráficos")
        return

    tracked_df = callback.get_tracked_exchanges()
    if tracked_df.empty:
        print("[ADVERTENCIA] No hay datos de intercambios para graficar")
        return

    os.makedirs(output_dir, exist_ok=True)

    # Definir los 3 rangos de generaciones
    first_gen = list(range(1, 11))
    mid_start = max(1, (max_gen // 2) - 4)
    mid_end = min(max_gen, mid_start + 9)
    mid_gen = list(range(mid_start, mid_end + 1))
    last_start = max(1, max_gen - 9)
    last_gen = list(range(last_start, max_gen + 1))

    first_data = tracked_df[tracked_df['generation'].isin(first_gen)]
    mid_data = tracked_df[tracked_df['generation'].isin(mid_gen)]
    last_data = tracked_df[tracked_df['generation'].isin(last_gen)]

    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    fig.suptitle('Distribución de Intercambios por Períodos de Evolución',
                 fontsize=16, fontweight='bold')

    period_configs = [
        (axes[0], first_data, first_gen, 'lightblue', f'Primeras 10 Generaciones\n(1-10)'),
        (axes[1], mid_data, mid_gen, 'lightgreen', f'10 Generaciones del Medio\n({mid_start}-{mid_end})'),
        (axes[2], last_data, last_gen, 'lightcoral', f'Últimas 10 Generaciones\n({last_start}-{max_gen})'),
    ]

    for ax, data, gen_range, color, title in period_configs:
        if not data.empty:
            box_data = []
            labels = []
            for gen in sorted(gen_range):
                gen_data = data[data['generation'] == gen]['n_exchanges']
                if len(gen_data) > 0:
                    box_data.append(gen_data.values)
                    labels.append(f'Gen {gen}')

            if box_data:
                bp = ax.boxplot(box_data, labels=labels, patch_artist=True)
                for patch in bp['boxes']:
                    patch.set_facecolor(color)
                    patch.set_alpha(0.7)
                for median in bp['medians']:
                    median.set_visible(False)
                means = [np.mean(d) for d in box_data]
                positions = range(1, len(means) + 1)
                for pos, mean_val in zip(positions, means):
                    ax.plot([pos - 0.3, pos + 0.3], [mean_val, mean_val], 'r-', linewidth=2, zorder=3)
                ax.plot([], [], 'r-', linewidth=2, label='Media')
                ax.set_title(title, fontsize=12, fontweight='bold')
                ax.set_xlabel('Generación', fontsize=10)
                ax.set_ylabel('Número de Intercambios', fontsize=10)
                ax.tick_params(axis='x', rotation=45)
                ax.grid(True, alpha=0.3, axis='y')
                ax.legend(fontsize=8)
            else:
                ax.text(0.5, 0.5, 'No hay datos disponibles',
                        ha='center', va='center', transform=ax.transAxes)
                ax.set_title(title, fontsize=12)
        else:
            ax.text(0.5, 0.5, 'No hay datos disponibles',
                    ha='center', va='center', transform=ax.transAxes)
            ax.set_title(title, fontsize=12)

    plt.tight_layout()
    output_path = os.path.join(output_dir, "exchange_distribution_by_periods.png")
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()

    print(f"  Gráfico de distribución por períodos guardado en: {output_path}")


def plot_pareto_front(pareto_df: pd.DataFrame, output_dir: str):
    """Genera gráficos del frente de Pareto en 2D"""
    if not MATPLOTLIB_OK:
        print("[ADVERTENCIA] matplotlib no instalado: omitiendo gráfico de frente de Pareto")
        return

    if pareto_df.empty:
        print("[ADVERTENCIA] No hay datos del frente de Pareto para graficar")
        return

    os.makedirs(output_dir, exist_ok=True)

    fig = plt.figure(figsize=(18, 14))
    fig.suptitle('Análisis del Frente de Pareto', fontsize=16, fontweight='bold')

    best_idx = None
    if 'score' in pareto_df.columns:
        best_idx = pareto_df['score'].idxmin()

    # Pares de objetivos para scatter plots
    scatter_configs = [
        (1, '1-cov_health', '1-cov_education', 'Salud vs Educación',
         '1 - Cobertura Salud', '1 - Cobertura Educación'),
        (2, '1-cov_health', '1-cov_greens', 'Salud vs Áreas Verdes',
         '1 - Cobertura Salud', '1 - Cobertura Áreas Verdes'),
        (3, '1-cov_education', '1-cov_work', 'Educación vs Trabajo',
         '1 - Cobertura Educación', '1 - Cobertura Trabajo'),
    ]

    for pos, xcol, ycol, title, xlabel, ylabel in scatter_configs:
        ax = plt.subplot(3, 3, pos)
        scatter = ax.scatter(pareto_df[xcol], pareto_df[ycol],
                           c=pareto_df['change_ratio'], cmap='viridis',
                           s=50, alpha=0.6, edgecolors='black', linewidth=0.5)
        if best_idx is not None:
            ax.scatter(pareto_df.loc[best_idx, xcol],
                      pareto_df.loc[best_idx, ycol],
                      s=200, marker='*', color='red', edgecolors='black',
                      linewidth=2, label='Solución óptima', zorder=5)
        ax.set_xlabel(xlabel, fontsize=11, fontweight='bold')
        ax.set_ylabel(ylabel, fontsize=11, fontweight='bold')
        ax.set_title(title, fontsize=12, fontweight='bold')
        ax.grid(True, alpha=0.3)
        ax.legend()
        plt.colorbar(scatter, ax=ax, label='Change Ratio')

    # Gráfico 4: Change Ratio vs Déficit de Cobertura Promedio
    ax4 = plt.subplot(3, 3, 4)
    avg_coverage_deficit = (pareto_df['1-cov_health'] + pareto_df['1-cov_education'] +
                           pareto_df['1-cov_greens'] + pareto_df['1-cov_work']) / 4.0
    scatter4 = ax4.scatter(pareto_df['change_ratio'], avg_coverage_deficit,
                          c=pareto_df['score'] if 'score' in pareto_df.columns else None,
                          cmap='plasma', s=50, alpha=0.6, edgecolors='black', linewidth=0.5)
    if best_idx is not None:
        ax4.scatter(pareto_df.loc[best_idx, 'change_ratio'],
                   avg_coverage_deficit.loc[best_idx],
                   s=200, marker='*', color='red', edgecolors='black',
                   linewidth=2, label='Solución óptima', zorder=5)
    ax4.set_xlabel('Change Ratio', fontsize=11, fontweight='bold')
    ax4.set_ylabel('Déficit de Cobertura Promedio', fontsize=11, fontweight='bold')
    ax4.set_title('Cambio Territorial vs Déficit de Cobertura', fontsize=12, fontweight='bold')
    ax4.grid(True, alpha=0.3)
    ax4.legend()
    if 'score' in pareto_df.columns:
        plt.colorbar(scatter4, ax=ax4, label='Score')

    # Gráfico 5: Distribución del Score
    ax5 = plt.subplot(3, 3, 5)
    if 'score' in pareto_df.columns:
        ax5.hist(pareto_df['score'], bins=20, edgecolor='black', alpha=0.7, color='steelblue')
        ax5.axvline(pareto_df['score'].min(), color='red', linestyle='--',
                   linewidth=2, label=f'Óptimo: {pareto_df["score"].min():.4f}')
        ax5.axvline(pareto_df['score'].mean(), color='green', linestyle='--',
                   linewidth=2, label=f'Promedio: {pareto_df["score"].mean():.4f}')
        ax5.set_xlabel('Score', fontsize=11, fontweight='bold')
        ax5.set_ylabel('Frecuencia', fontsize=11, fontweight='bold')
        ax5.set_title('Distribución del Score en el Frente de Pareto', fontsize=12, fontweight='bold')
        ax5.legend()
        ax5.grid(True, alpha=0.3, axis='y')
    else:
        ax5.text(0.5, 0.5, 'Score no disponible',
                ha='center', va='center', transform=ax5.transAxes)
        ax5.set_title('Distribución del Score', fontsize=12)

    # Gráfico 6: Cobertura vs Change Ratio
    ax6 = plt.subplot(3, 3, 7)
    avg_coverage_deficit = (pareto_df['1-cov_health'] + pareto_df['1-cov_education'] +
                           pareto_df['1-cov_greens'] + pareto_df['1-cov_work']) / 4.0
    avg_coverage = 1.0 - avg_coverage_deficit

    scatter6 = ax6.scatter(pareto_df['change_ratio'], avg_coverage * 100,
                          c=pareto_df['score'] if 'score' in pareto_df.columns else None,
                          cmap='coolwarm', s=80, alpha=0.7, edgecolors='black', linewidth=1)
    if best_idx is not None:
        ax6.scatter(pareto_df.loc[best_idx, 'change_ratio'],
                   avg_coverage.loc[best_idx] * 100,
                   s=300, marker='*', color='gold', edgecolors='black',
                   linewidth=2, label='Solución óptima', zorder=5)
    ax6.set_xlabel('Change Ratio (Proporción de Cambios)', fontsize=11, fontweight='bold')
    ax6.set_ylabel('Cobertura Promedio (%)', fontsize=11, fontweight='bold')
    ax6.set_title('Cobertura vs Cambio Territorial', fontsize=12, fontweight='bold')
    ax6.grid(True, alpha=0.3)
    ax6.legend()
    if 'score' in pareto_df.columns:
        plt.colorbar(scatter6, ax=ax6, label='Score')

    # Gráfico 7: Resumen estadístico
    ax7 = plt.subplot(3, 3, 8)
    ax7.axis('off')
    stats_text = f"""
    ESTADÍSTICAS DEL FRENTE DE PARETO

    Número de soluciones: {len(pareto_df)}

    Cobertura Salud:
      Min: {pareto_df['1-cov_health'].min():.3f}
      Max: {pareto_df['1-cov_health'].max():.3f}
      Promedio: {pareto_df['1-cov_health'].mean():.3f}

    Cobertura Educación:
      Min: {pareto_df['1-cov_education'].min():.3f}
      Max: {pareto_df['1-cov_education'].max():.3f}
      Promedio: {pareto_df['1-cov_education'].mean():.3f}

    Cobertura Áreas Verdes:
      Min: {pareto_df['1-cov_greens'].min():.3f}
      Max: {pareto_df['1-cov_greens'].max():.3f}
      Promedio: {pareto_df['1-cov_greens'].mean():.3f}

    Cobertura Trabajo:
      Min: {pareto_df['1-cov_work'].min():.3f}
      Max: {pareto_df['1-cov_work'].max():.3f}
      Promedio: {pareto_df['1-cov_work'].mean():.3f}

    Change Ratio:
      Min: {pareto_df['change_ratio'].min():.3f}
      Max: {pareto_df['change_ratio'].max():.3f}
      Promedio: {pareto_df['change_ratio'].mean():.3f}
    """
    if 'score' in pareto_df.columns:
        stats_text += f"""

    Score:
      Min: {pareto_df['score'].min():.4f}
      Max: {pareto_df['score'].max():.4f}
      Promedio: {pareto_df['score'].mean():.4f}
        """
    ax7.text(0.1, 0.9, stats_text, transform=ax7.transAxes,
            fontsize=9, verticalalignment='top', family='monospace',
            bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

    # Gráfico 8: Trade-off análisis
    ax8 = plt.subplot(3, 3, 9)
    avg_coverage_deficit = (pareto_df['1-cov_health'] + pareto_df['1-cov_education'] +
                           pareto_df['1-cov_greens'] + pareto_df['1-cov_work']) / 4.0
    avg_coverage = (1.0 - avg_coverage_deficit) * 100

    scatter = ax8.scatter(pareto_df['change_ratio'], avg_coverage,
                         c=pareto_df['score'] if 'score' in pareto_df.columns else None,
                         cmap='viridis', s=60, alpha=0.7, edgecolors='black', linewidth=0.5,
                         label='Soluciones del frente de Pareto')

    if best_idx is not None:
        ax8.scatter(pareto_df.loc[best_idx, 'change_ratio'],
                   avg_coverage.loc[best_idx],
                   s=300, marker='*', color='red', edgecolors='black',
                   linewidth=2, label='Solución óptima', zorder=5)

    if len(pareto_df) > 10:
        n_bins = min(10, len(pareto_df) // 3)
        if n_bins > 1:
            bins = np.linspace(pareto_df['change_ratio'].min(), pareto_df['change_ratio'].max(), n_bins + 1)
            bin_centers = (bins[:-1] + bins[1:]) / 2
            bin_coverage_avg = []

            for i in range(len(bins) - 1):
                mask = (pareto_df['change_ratio'] >= bins[i]) & (pareto_df['change_ratio'] < bins[i+1])
                if i == len(bins) - 2:
                    mask = (pareto_df['change_ratio'] >= bins[i]) & (pareto_df['change_ratio'] <= bins[i+1])
                bin_coverage_avg.append(avg_coverage.loc[mask].mean() if mask.sum() > 0 else np.nan)

            bin_coverage_avg = np.array(bin_coverage_avg)
            valid_bins = ~np.isnan(bin_coverage_avg)

            if valid_bins.sum() > 1:
                ax8.plot(bin_centers[valid_bins], bin_coverage_avg[valid_bins],
                        'r--', linewidth=2, alpha=0.5, label='Promedio por rangos')

    ax8.set_xlabel('Change Ratio', fontsize=11, fontweight='bold')
    ax8.set_ylabel('Cobertura Promedio (%)', fontsize=11, fontweight='bold')
    ax8.set_title('Trade-off: Cobertura vs Cambios (Todas las Soluciones)',
                 fontsize=12, fontweight='bold')
    ax8.grid(True, alpha=0.3)
    ax8.legend(fontsize=9)
    if 'score' in pareto_df.columns:
        plt.colorbar(scatter, ax=ax8, label='Score')

    plt.tight_layout()
    output_path = os.path.join(output_dir, "pareto_front_analysis.png")
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()

    print(f"  Gráfico del frente de Pareto guardado en: {output_path}")


def plot_coverage_comparison(initial_metrics: Dict[str, float],
                             final_metrics: Dict[str, float],
                             output_dir: str):
    """Genera gráfico de comparación de coberturas antes y después"""
    if not MATPLOTLIB_OK:
        print("[ADVERTENCIA] matplotlib no instalado: omitiendo gráfico de comparación")
        return

    os.makedirs(output_dir, exist_ok=True)

    categories = ['health', 'education', 'greens', 'work']
    category_labels = {
        'health': 'Salud',
        'education': 'Educación',
        'greens': 'Áreas Verdes',
        'work': 'Trabajo'
    }

    initial_covs = []
    final_covs = []
    improvements = []
    labels = []

    for cat in categories:
        key = f'cov_{cat}'
        if key in initial_metrics and key in final_metrics:
            init_val = initial_metrics[key]
            final_val = final_metrics[key]
            initial_covs.append(init_val)
            final_covs.append(final_val)
            improvements.append(final_val - init_val)
            labels.append(category_labels[cat])

    if 'cov_all' in initial_metrics and 'cov_all' in final_metrics:
        initial_covs.append(initial_metrics['cov_all'])
        final_covs.append(final_metrics['cov_all'])
        improvements.append(final_metrics['cov_all'] - initial_metrics['cov_all'])
        labels.append('Todas las\nCategorías')

    if not initial_covs:
        print("[ADVERTENCIA] No hay datos de cobertura para comparar")
        return

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))
    fig.suptitle('Comparación de Coberturas: Estado Inicial vs Optimizado',
                fontsize=16, fontweight='bold')

    x = np.arange(len(labels))
    width = 0.35

    bars1 = ax1.bar(x - width/2, [v * 100 for v in initial_covs], width,
                   label='Estado Inicial', color='#ff6b6b', alpha=0.8, edgecolor='black', linewidth=1)
    bars2 = ax1.bar(x + width/2, [v * 100 for v in final_covs], width,
                   label='Estado Optimizado', color='#51cf66', alpha=0.8, edgecolor='black', linewidth=1)

    for i, (bar1, bar2) in enumerate(zip(bars1, bars2)):
        height1 = bar1.get_height()
        height2 = bar2.get_height()
        ax1.text(bar1.get_x() + bar1.get_width()/2., height1,
                f'{height1:.1f}%', ha='center', va='bottom', fontsize=9, fontweight='bold')
        ax1.text(bar2.get_x() + bar2.get_width()/2., height2,
                f'{height2:.1f}%', ha='center', va='bottom', fontsize=9, fontweight='bold')

    ax1.set_xlabel('Categoría de Servicio', fontsize=12, fontweight='bold')
    ax1.set_ylabel('Cobertura (%)', fontsize=12, fontweight='bold')
    ax1.set_title('Cobertura por Categoría', fontsize=13, fontweight='bold')
    ax1.set_xticks(x)
    ax1.set_xticklabels(labels, fontsize=10)
    ax1.legend(fontsize=11)
    ax1.grid(True, alpha=0.3, axis='y')
    ax1.set_ylim(0, max(max(initial_covs), max(final_covs)) * 100 * 1.15)

    colors = ['#4dabf7' if imp >= 0 else '#ff8787' for imp in improvements]
    bars3 = ax2.barh(labels, [imp * 100 for imp in improvements],
                     color=colors, alpha=0.8, edgecolor='black', linewidth=1)

    for i, (bar, imp) in enumerate(zip(bars3, improvements)):
        w = bar.get_width()
        ax2.text(w, bar.get_y() + bar.get_height()/2.,
                f'{w:+.1f}%', ha='left' if w >= 0 else 'right',
                va='center', fontsize=10, fontweight='bold')

    ax2.set_xlabel('Mejora en Cobertura (%)', fontsize=12, fontweight='bold')
    ax2.set_title('Mejora por Categoría', fontsize=13, fontweight='bold')
    ax2.axvline(0, color='black', linestyle='-', linewidth=1)
    ax2.grid(True, alpha=0.3, axis='x')

    plt.tight_layout()
    output_path = os.path.join(output_dir, "coverage_comparison.png")
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()

    print(f"  Gráfico de comparación de coberturas guardado en: {output_path}")


def create_state_map(
    boundary: gpd.GeoDataFrame,
    homes: gpd.GeoDataFrame,
    services: Dict[str, gpd.GeoDataFrame],
    reach: pd.DataFrame = None,
    title: str = "Estado del Distrito",
    minutes: float = 15.0
):
    """Genera un mapa estilizado para cualquier estado (antes o después de optimización).

    Args:
        boundary: Límite del área geográfica
        homes: GeoDataFrame de hogares
        services: Servicios por categoría
        reach: DataFrame de alcanzabilidad (si None, no se colorean hogares por cobertura)
        title: Título para la leyenda del mapa
        minutes: Umbral de minutos (para mostrar en leyenda)
    """
    if not FOLIUM_OK:
        print("folium no instalado: omitiendo mapa")
        return None

    center = [boundary.geometry.centroid.y.iloc[0], boundary.geometry.centroid.x.iloc[0]]
    m = folium.Map(
        location=center,
        zoom_start=14,
        control_scale=True,
        tiles="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        attr="OpenStreetMap HOT",
    )

    # Límite del distrito
    folium.GeoJson(
        boundary.to_json(),
        name="Limite del distrito",
        style_function=lambda x: {
            'fillColor': '#f0f0f0',
            'fillOpacity': 0.1,
            'color': '#333333',
            'weight': 2.5,
            'dashArray': '5, 5',
        }
    ).add_to(m)

    # Colores de servicio
    SERVICE_COLORS = {
        "health": "#e74c3c",
        "education": "#3498db",
        "greens": "#27ae60",
        "work": "#8e44ad",
    }
    SERVICE_LABELS = {
        "health": "Salud",
        "education": "Educacion",
        "greens": "Areas Verdes",
        "work": "Trabajo",
    }

    # Hogares
    fg_homes = folium.FeatureGroup(name="Hogares", show=True).add_to(m)

    if reach is not None and "all_categories" in reach.columns:
        covered = homes[reach["all_categories"]]
        uncovered = homes[~reach["all_categories"]]

        for _, row in covered.iterrows():
            folium.CircleMarker(
                [row.geometry.y, row.geometry.x],
                radius=3,
                color='#2ecc71',
                fill=True,
                fillColor='#2ecc71',
                fillOpacity=0.7,
                weight=1,
                tooltip="Hogar: cubierto"
            ).add_to(fg_homes)

        for _, row in uncovered.iterrows():
            folium.CircleMarker(
                [row.geometry.y, row.geometry.x],
                radius=3,
                color='#e74c3c',
                fill=True,
                fillColor='#e74c3c',
                fillOpacity=0.7,
                weight=1,
                tooltip="Hogar: NO cubierto"
            ).add_to(fg_homes)
    else:
        for _, row in homes.iterrows():
            folium.CircleMarker(
                [row.geometry.y, row.geometry.x],
                radius=3,
                color='#34495e',
                fill=True,
                fillColor='#34495e',
                fillOpacity=0.6,
                weight=1,
                tooltip="Hogar"
            ).add_to(fg_homes)

    # Servicios (una capa por categoría para poder alternarlas)
    for cat, gdf in services.items():
        color = SERVICE_COLORS.get(cat, '#95a5a6')
        label = SERVICE_LABELS.get(cat, cat)
        fg = folium.FeatureGroup(name=label, show=True).add_to(m)

        for _, row in gdf.iterrows():
            folium.CircleMarker(
                [row.geometry.y, row.geometry.x],
                radius=5,
                color=color,
                fill=True,
                fillColor=color,
                fillOpacity=0.85,
                weight=1.5,
                tooltip=f"{label}"
            ).add_to(fg)

    # Leyenda
    has_coverage = reach is not None and "all_categories" in reach.columns
    coverage_pct = ""
    if has_coverage:
        cov = reach["all_categories"].mean() * 100
        coverage_pct = f"<p style='margin:4px 0'><b>Cobertura total: {cov:.1f}%</b></p><hr style='margin:6px 0'>"

    home_legend = ""
    if has_coverage:
        home_legend = (
            "<p style='margin:3px 0'><span style='color:#2ecc71'>&#9679;</span> Hogar cubierto</p>"
            "<p style='margin:3px 0'><span style='color:#e74c3c'>&#9679;</span> Hogar NO cubierto</p>"
        )
    else:
        home_legend = "<p style='margin:3px 0'><span style='color:#34495e'>&#9679;</span> Hogar</p>"

    service_legend = ""
    for cat in ["health", "education", "greens", "work"]:
        if cat in services:
            color = SERVICE_COLORS[cat]
            label = SERVICE_LABELS[cat]
            count = len(services[cat])
            service_legend += f"<p style='margin:3px 0'><span style='color:{color}'>&#9679;</span> {label} ({count})</p>"

    legend_html = f'''
    <div style="position: fixed;
                top: 14px; right: 14px; width: 220px;
                background-color: white; z-index:9999; font-size:13px;
                border:1px solid #ccc; border-radius: 8px; padding: 12px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.15); font-family: Arial, sans-serif;">
        <p style="margin:0 0 6px 0; font-size:14px;"><b>{title}</b></p>
        <p style="margin:2px 0; color:#888; font-size:11px;">Umbral: {minutes} min caminando</p>
        {coverage_pct}
        <hr style="margin:6px 0">
        {home_legend}
        <hr style="margin:6px 0">
        {service_legend}
    </div>
    '''
    m.get_root().html.add_child(folium.Element(legend_html))

    folium.LayerControl(collapsed=True).add_to(m)

    return m
