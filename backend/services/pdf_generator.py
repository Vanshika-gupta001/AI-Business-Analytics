import os
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image
)

from reportlab.lib.styles import getSampleStyleSheet


def generate_pdf_report(data):

    os.makedirs("reports", exist_ok=True)

    filename = data.get("filename", "report.csv")
    pdf_name = filename.replace(".csv", "_business_report.pdf")

    pdf_path = os.path.join(
        "reports",
        pdf_name
    )

    doc = SimpleDocTemplate(pdf_path)

    styles = getSampleStyleSheet()

    content = []


    # Title

    content.append(
        Paragraph(
            "AI Business Analytics Report",
            styles["Title"]
        )
    )

    content.append(Spacer(1,20))


    # Dataset Overview

    content.append(
        Paragraph(
            "1. Dataset Overview",
            styles["Heading2"]
        )
    )


    dataset = data.get(
        "dataset_info",
        {}
    )


    overview = f"""
    Rows: {dataset.get('rows')}<br/>
    Columns: {dataset.get('columns')}<br/>
    Numeric Columns: {dataset.get('numeric_columns')}<br/>
    Categorical Columns: {dataset.get('categorical_columns')}<br/>
    Memory Usage: {dataset.get('memory_usage_kb')} KB
    """


    content.append(
        Paragraph(
            overview,
            styles["BodyText"]
        )
    )


    content.append(Spacer(1,15))


    # Health Score

    content.append(
        Paragraph(
            "2. Data Health Assessment",
            styles["Heading2"]
        )
    )


    health = f"""
    Health Score: {data.get('health_score')}/100<br/>
    Grade: {data.get('grade')}<br/>
    Status: {data.get('status')}
    """

    content.append(
        Paragraph(
            health,
            styles["BodyText"]
        )
    )


    content.append(Spacer(1,15))


    # Insights

    content.append(
        Paragraph(
            "3. Insights",
            styles["Heading2"]
        )
    )


    for item in data.get("insights", []):

        content.append(
            Paragraph(
                "• " + item,
                styles["BodyText"]
            )
        )


    content.append(
        Spacer(1,15)
    )


    # Recommendations

    content.append(
        Paragraph(
            "4. Recommendations",
            styles["Heading2"]
        )
    )


    for item in data.get(
        "recommendations",
        []
    ):

        content.append(
            Paragraph(
                "• " + item,
                styles["BodyText"]
            )
        )


    content.append(
        Spacer(1,15)
    )


    # AI Summary

    content.append(
        Paragraph(
            "5. AI Summary",
            styles["Heading2"]
        )
    )


    content.append(
        Paragraph(
            data.get(
                "ai_summary",
                "Not available"
            ),
            styles["BodyText"]
        )
    )


    content.append(
        Spacer(1,15)
    )


    # Charts

    content.append(
        Paragraph(
            "6. Generated Charts",
            styles["Heading2"]
        )
    )


    for chart in data.get(
        "charts",
        []
    ):

        chart_path = chart.replace(
            "/",
            "\\"
        )

        if os.path.exists(chart_path):

            content.append(
                Image(
                    chart_path,
                    width=350,
                    height=220
                )
            )

            content.append(
                Spacer(1,10)
            )


    doc.build(content)


    return pdf_path