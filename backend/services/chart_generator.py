import os
import matplotlib.pyplot as plt
import seaborn as sns

UPLOAD_FOLDER = "uploads/charts"


def generate_charts(df):

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    charts = []

    # -------------------------
    # 1. Histogram (numeric)
    # -------------------------
    numeric_columns = df.select_dtypes(include=["number"]).columns

    for col in numeric_columns:

        plt.figure(figsize=(6, 4))
        df[col].hist()

        filename = f"{col}_histogram.png"
        filepath = os.path.join(UPLOAD_FOLDER, filename).replace("\\", "/")

        plt.title(col)
        plt.savefig(filepath)
        plt.close()

        charts.append(filepath)

    # -------------------------
    # 2. Correlation Matrix
    # -------------------------
    numeric_df = df.select_dtypes(include=["number"])

    if len(numeric_df.columns) > 1:

        plt.figure(figsize=(6, 5))

        sns.heatmap(
            numeric_df.corr(),
            annot=True,
            cmap="Blues"
        )

        corr_path = os.path.join(
            UPLOAD_FOLDER,
            "correlation_matrix.png"
        ).replace("\\", "/")

        plt.title("Correlation Matrix")
        plt.savefig(corr_path)
        plt.close()

        charts.append(corr_path)

    # -------------------------
    # 3. Box Plot (numeric)
    # -------------------------
    for col in numeric_columns:

        plt.figure(figsize=(6, 4))
        plt.boxplot(df[col].dropna())

        filename = f"{col}_boxplot.png"
        filepath = os.path.join(UPLOAD_FOLDER, filename).replace("\\", "/")

        plt.title(f"{col} Box Plot")
        plt.savefig(filepath)
        plt.close()

        charts.append(filepath)

    # -------------------------
    # 4. Pie Chart (categorical)
    # -------------------------
    text_columns = df.select_dtypes(include=["object"]).columns

    for col in text_columns:

        if df[col].nunique() <= 10:

            filename = f"{col}_piechart.png"
            filepath = os.path.join(UPLOAD_FOLDER, filename).replace("\\", "/")

            # prevent duplicates
            if filepath in charts:
                continue

            plt.figure(figsize=(6, 6))

            df[col].value_counts().plot(
                kind="pie",
                autopct="%1.1f%%"
            )

            plt.ylabel("")
            plt.title(f"{col} Distribution")

            plt.savefig(filepath)
            plt.close()

            charts.append(filepath)

    return charts