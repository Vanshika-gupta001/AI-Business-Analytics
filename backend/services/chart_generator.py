import os
import gc
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

UPLOAD_FOLDER = "uploads/charts"

# Matches the app's CSS design tokens (see frontend/app/globals.css) so
# charts don't look like a jarring white box dropped into a dark UI.
COLOR_INK = "#0b0f14"
COLOR_SURFACE = "#131920"
COLOR_BORDER = "#232b35"
COLOR_TEXT = "#e8eaed"
COLOR_TEXT_MUTED = "#8b96a3"
COLOR_ACCENT = "#d4a24c"
COLOR_TEAL = "#4fb3a9"

PALETTE = [COLOR_ACCENT, COLOR_TEAL, "#e06b5d", "#6ab97d", "#8b96a3", "#d4a24c99"]

# Columns with more unique values than this fraction of total rows look
# like identifiers/free text, not something worth charting.
MAX_CHART_CARDINALITY_RATIO = 0.5


def _apply_dark_style():

    plt.rcParams.update({
        "figure.facecolor": COLOR_SURFACE,
        "axes.facecolor": COLOR_SURFACE,
        "savefig.facecolor": COLOR_SURFACE,
        "axes.edgecolor": COLOR_BORDER,
        "axes.labelcolor": COLOR_TEXT,
        "text.color": COLOR_TEXT,
        "xtick.color": COLOR_TEXT_MUTED,
        "ytick.color": COLOR_TEXT_MUTED,
        "axes.titlecolor": COLOR_TEXT,
        "grid.color": COLOR_BORDER,
        "font.size": 10,
    })


def generate_charts(df):

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    _apply_dark_style()

    charts = []

    rows = len(df)

    # Sample large datasets before plotting — a histogram/boxplot from
    # 250,000 points looks statistically identical to one from a 5,000-point
    # sample, but uses a fraction of the memory. Crucial on memory-limited
    # hosting (Render's free 512MB instances).
    MAX_CHART_ROWS = 5000

    plot_df = df.sample(n=MAX_CHART_ROWS, random_state=42) if rows > MAX_CHART_ROWS else df

    # -------------------------
    # 1. Histogram (numeric)
    # -------------------------
    numeric_columns = df.select_dtypes(include=["number"]).columns

    for col in numeric_columns:

        plt.figure(figsize=(6, 4))

        plt.hist(plot_df[col].dropna(), color=COLOR_ACCENT, edgecolor=COLOR_INK)

        filename = f"{col}_histogram.png"
        filepath = os.path.join(UPLOAD_FOLDER, filename).replace("\\", "/")

        plt.title(col)
        plt.grid(alpha=0.2)
        plt.tight_layout()
        plt.savefig(filepath)
        plt.close()

        charts.append(filepath)

    # -------------------------
    # 2. Correlation Matrix
    # -------------------------
    numeric_df = plot_df.select_dtypes(include=["number"])

    if len(numeric_df.columns) > 1:

        plt.figure(figsize=(6, 5))

        sns.heatmap(
            numeric_df.corr(),
            annot=True,
            cmap="rocket",
            cbar_kws={"label": ""},
            linewidths=0.5,
            linecolor=COLOR_BORDER
        )

        corr_path = os.path.join(
            UPLOAD_FOLDER,
            "correlation_matrix.png"
        ).replace("\\", "/")

        plt.title("Correlation Matrix")
        plt.tight_layout()
        plt.savefig(corr_path)
        plt.close()

        charts.append(corr_path)

    # -------------------------
    # 3. Box Plot (numeric)
    # -------------------------
    for col in numeric_columns:

        plt.figure(figsize=(6, 4))

        box = plt.boxplot(plot_df[col].dropna(),
            patch_artist=True,
            tick_labels=[col]
        )

        for patch in box["boxes"]:
            patch.set_facecolor(COLOR_ACCENT)
            patch.set_alpha(0.6)

        for element in ("whiskers", "caps", "medians"):
            for line in box[element]:
                line.set_color(COLOR_TEXT_MUTED)

        filename = f"{col}_boxplot.png"
        filepath = os.path.join(UPLOAD_FOLDER, filename).replace("\\", "/")

        plt.title(f"{col} Box Plot")
        plt.grid(alpha=0.2, axis="y")
        plt.tight_layout()
        plt.savefig(filepath)
        plt.close()

        charts.append(filepath)

    # -------------------------
    # 4. Pie Chart (categorical, low-cardinality only)
    # -------------------------
    text_columns = df.select_dtypes(include=["object"]).columns

    for col in text_columns:

        unique_count = plot_df[col].nunique()

        # Skip ID-like / free-text columns — a pie chart of 60 unique
        # names is noise, not an insight.
        if rows > 0 and (unique_count / rows) > MAX_CHART_CARDINALITY_RATIO:
            continue

        if unique_count <= 10:

            filename = f"{col}_piechart.png"
            filepath = os.path.join(UPLOAD_FOLDER, filename).replace("\\", "/")

            if filepath in charts:
                continue

            plt.figure(figsize=(6, 6))

            plot_df[col].value_counts().plot(kind="pie",
                autopct="%1.1f%%",
                colors=PALETTE,
                textprops={"color": COLOR_TEXT}
            )

            plt.ylabel("")
            plt.title(f"{col} Distribution")
            plt.tight_layout()
            plt.savefig(filepath)
            plt.close()

            charts.append(filepath)
    # Explicitly release matplotlib/pandas memory — matters a lot on
    # memory-constrained hosting (e.g. Render's free 512MB instances).
    plt.close("all")
    gc.collect()

    return charts